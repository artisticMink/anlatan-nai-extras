//You'll likely need to import extension_settings, getContext, and loadExtensionSettings from extensions.js
import { extension_settings, extensionsHandlebars } from '../../../extensions.js';
import { event_types, eventSource, saveSettingsDebounced } from '../../../../script.js';

// Keep track of where your extension is located, name should match repo name
const extensionName = 'anlatan-nai-extras';
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
const extensionSettings = extension_settings[extensionName];
const defaultSettings = {
    removeLastMentionOfUser: false,
    removeExampleChatSeparators: false,
    storyString: `{{wiBefore}}
    {{description}}
    {{personality}}
    {{persona}}
    {{wiAfter}}
    {{examples}}
    {{scenario}}
    ***
    {{preamble}}
    {{instruct main}}
    {{chat}}`,
};

function onStoryStringChange(event) {
    extension_settings[extensionName].storyString = event.target.value;
    saveSettingsDebounced();
}

function onRemoveLastMentionOfUserChange(event) {
    extension_settings[extensionName].removeLastMentionOfUser = Boolean(event.target.checked);
    saveSettingsDebounced();
}

function onRemoveExampleChatSeparatorsChange(event) {
    extension_settings[extensionName].removeExampleChatSeparators = Boolean(event.target.checked);
    saveSettingsDebounced();
}

const removeLastOccurrence = (target, str) => {
    if (typeof target !== 'string' || typeof str !== 'string') {
        throw new Error('Both target and str must be of type string');
    }

    const index = target.lastIndexOf(str);

    if (index !== -1 && index === target.length - str.length) {
        return target.substring(0, index);
    }

    return target;
};


// Loads the extension settings if they exist, otherwise initializes them to the defaults.
async function loadSettings() {
    //Create the settings if they don't exist
    extension_settings[extensionName] = extension_settings[extensionName] || {};
    if (Object.keys(extension_settings[extensionName]).length === 0) {
        Object.assign(extension_settings[extensionName], defaultSettings);
    }
}

(async function() {
    // Load settings when starting things up (if you have any)
    await loadSettings();
    const settings = extension_settings[extensionName];

    const container = document.getElementById('novel_api-settings');
    const naiExtrasHtml = await $.get(`${extensionFolderPath}/example.html`);

    container.insertAdjacentHTML('beforeend', naiExtrasHtml);

    const storyStringTextarea = document.getElementById('anlatan-nai-extras-storystring-template');
    const removeLastMentionOfUserToggle = document.getElementById('anlatan-nai-extras-settings-removeLastMentionOfUser');
    const removeExampleChatSeparators = document.getElementById('anlatan-nai-extras-settings-removeExampleChatSeparators');

    storyStringTextarea.value = settings.storyString;
    removeLastMentionOfUserToggle.checked = settings.removeLastMentionOfUser;
    removeExampleChatSeparators.checked = settings.removeExampleChatSeparators;

    extensionsHandlebars.registerHelper('instruct', function(text) {
        if (!text) return '';
        return '{' + text + '}';
    });

    extensionsHandlebars.registerHelper('trim', function(options) {
        return options.fn(this).replace(/\s{3,}/g,' ').replace(/\n{3,}/g, '\n').trim();
    });


    const orderInput = (data) => {
        if ('novel' !== data.api) return;

        const storyStringTemplate = extensionsHandlebars.compile(`${settings.storyString} {{generatedPromptCache}}` , { noEscape: true });

        let chat = data.finalMesSend
            .map((e) => `${e.extensionPrompts.join('')}${e.message}`)
            .join('')
            .trim();

        if (settings.removeLastMentionOfUser) chat = removeLastOccurrence(chat, `${data.char}:`);

        let examples = data.mesExmString;
        if (settings.removeExampleChatSeparators) examples = examples.replaceAll('***', '');

        data.combinedPrompt = storyStringTemplate({
            wiBefore: data.beforeScenarioAnchor,
            description: data.description,
            personality : data.personality,
            persona : data.persona,
            wiAfter: data.afterScenarioAnchor,
            examples,
            scenario : data.scenario,
            preamble: data.naiPreamble,
            main: data.main,
            jailbreak: data.jailbreak,
            chat,
            generatedPromptCache: data.generatedPromptCache,
        }).trim();
    };

    eventSource.on(event_types.GENERATE_BEFORE_COMBINE_PROMPTS, orderInput);
    storyStringTextarea.addEventListener('change', onStoryStringChange);
    removeLastMentionOfUserToggle.addEventListener('change', onRemoveLastMentionOfUserChange);
    removeExampleChatSeparators.addEventListener('change', onRemoveExampleChatSeparatorsChange);
})();
