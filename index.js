//You'll likely need to import extension_settings, getContext, and loadExtensionSettings from extensions.js
import { extension_settings, extensionsHandlebars } from '../../../extensions.js';
import { event_types, eventSource, saveSettingsDebounced } from '../../../../script.js';

// Keep track of where your extension is located, name should match repo name
const extensionName = 'anlatan-nai-extras';
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
const extensionSettings = extension_settings[extensionName];
const defaultSettings = {
        storyString: '{{wiBefore}} {{description}} {{personality}} {{persona}} {{wiAfter}} {{chatExamples}} {{scenario}} {{preamble}} {{chatHistory}}',
};

function onStoryStringChange(event) {
    extension_settings[extensionName].storyString = event.target.value;
    saveSettingsDebounced();
}

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

    storyStringTextarea.value = settings.storyString;

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

        data.extensionOutput = storyStringTemplate({
            wiBefore: data.beforeScenarioAnchor,
            description: data.description,
            personality : data.personality,
            persona : data.persona,
            wiAfter: data.afterScenarioAnchor,
            examples: data.mesExmString,
            scenario : data.scenario,
            preamble: data.naiPreamble,
            main: data.main,
            jailbreak: data.jailbreak,
            chat: data.finalMesSend.map((e) => `${e.extensionPrompts.join('')}${e.message}`).join(''),
            generatedPromptCache: data.generatedPromptCache,
        });
    };

    eventSource.on(event_types.GENERATE_BEFORE_COMBINE_PROMPTS, orderInput);
    storyStringTextarea.addEventListener('change', onStoryStringChange);
})();
