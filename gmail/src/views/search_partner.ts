import { logEmail } from "../services/log_email";
import { _t } from "../services/translation";
import { Partner } from "../models/partner";
import { ErrorMessage } from "../models/error_message";
import { createKeyValueWidget, actionCall, pushCard, updateCard, notify } from "./helpers";
import { buildView } from "./index";
import { State } from "../models/state";
import { SOCIAL_MEDIA_ICONS, UI_ICONS } from "./icons";
import { onEmailAlreadyLogged } from "./partner";

function onSearchPartnerClick(state: State, parameters: any, inputs: any) {
    const inputQuery = inputs.search_partner_query;
    const query = (inputQuery && inputQuery.length && inputQuery[0]) || "";
    const [partners, error] = query && query.length ? Partner.searchPartner(query) : [[], new ErrorMessage()];

    state.searchedPartners = partners;

    return updateCard(buildSearchPartnerView(state, query));
}
function onLogEmailPartner(state: State, parameters: any) {
    const partnerId = parameters.partnerId;

    if (!partnerId) {
        throw new Error(_t("This contact does not exist in the Odoo database."));
    }

    if (State.checkLoggingState(state.email.messageId, "partners", partnerId)) {
        state.error = logEmail(partnerId, "res.partner", state.email);
        if (!state.error.code) {
            State.setLoggingState(state.email.messageId, "partners", partnerId);
        }
        return updateCard(buildSearchPartnerView(state, parameters.query));
    }
    return notify(_t("Email already logged on the contact"));
}

function onOpenPartner(state: State, parameters: any) {
    const partner = parameters.partner;
    const [newPartner, odooUserCompanies, canCreatePartner, canCreateProject, error] = Partner.getPartner(
        partner.email,
        partner.name,
        partner.id
    );
    const newState = new State(
        newPartner,
        canCreatePartner,
        state.email,
        odooUserCompanies,
        null,
        null,
        canCreateProject,
        error
    );
    return pushCard(buildView(newState));
}

export function buildSearchPartnerView(state: State, query: string, initialSearch: boolean = false) {
    const loggingState = State.getLoggingState(state.email.messageId);

    const card = CardService.newCardBuilder();
    let partners = (state.searchedPartners || []).filter((partner) => partner.id);
    let searchValue = query;

    if (initialSearch && partners.length <= 1) {
        partners = [];
        searchValue = "";
    }

    const searchSection = CardService.newCardSection();

    searchSection.addWidget(
        CardService.newTextInput()
            .setFieldName("search_partner_query")
            .setTitle(_t("Search contact"))
            .setValue(searchValue)
            .setOnChangeAction(actionCall(state, onSearchPartnerClick.name))
    );

    searchSection.addWidget(
        CardService.newTextButton().setText(_t("Search")).setOnClickAction(actionCall(state, onSearchPartnerClick.name))
    );

    for (let partner of partners) {
        const partnerCard = CardService.newDecoratedText()
            .setText(partner.name)
            .setWrapText(true)
            .setOnClickAction(actionCall(state, onOpenPartner.name, { partner: partner }))
            .setStartIcon(
                CardService.newIconImage()
                    .setIconUrl(partner.image || (partner.isCompany ? UI_ICONS.no_company : UI_ICONS.person))
                    .setImageCropType(CardService.ImageCropType.CIRCLE)
            );

        if (partner.isWriteable) {
            partnerCard.setButton(
                loggingState["partners"].indexOf(partner.id) < 0
                    ? CardService.newImageButton()
                          .setAltText(_t("Log email"))
                          .setIconUrl(UI_ICONS.email_in_odoo)
                          .setOnClickAction(
                              actionCall(state, onLogEmailPartner.name, {
                                  partnerId: partner.id,
                                  query: query
                              })
                          )
                    : CardService.newImageButton()
                          .setAltText(_t("Email already logged on the contact"))
                          .setIconUrl(UI_ICONS.email_logged)
                          .setOnClickAction(actionCall(state, onEmailAlreadyLogged.name))
            );
        }

        if (partner.email) {
            partnerCard.setBottomLabel(partner.email);
        }

        searchSection.addWidget(partnerCard);
    }

    if ((!partners || !partners.length) && !initialSearch) {
        searchSection.addWidget(CardService.newTextParagraph().setText(_t("No contact found.")));
    }

    card.addSection(searchSection);
    return card.build();
}
