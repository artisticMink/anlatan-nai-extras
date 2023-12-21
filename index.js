//You'll likely need to import extension_settings, getContext, and loadExtensionSettings from extensions.js
import { extension_settings, extensionsHandlebars } from '../../../extensions.js';
import { event_types, eventSource, saveSettingsDebounced } from '../../../../script.js';
import { uuidv4 } from '../../../utils.js';

// Keep track of where your extension is located, name should match repo name
const extensionName = 'anlatan-nai-extras';
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
const extensionSettings = extension_settings[extensionName];
const defaultSettings = {
    removeLastMentionOfChar: false,
    removeExampleChatSeparators: false,
    removeCharAndUser: false,
    textBlocks: [],
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
    extensionSettings.storyString = event.target.value;
    saveSettingsDebounced();
}

function onRemoveLastMentionOfCharChange(event) {
    extensionSettings.removeLastMentionOfChar = Boolean(event.target.checked);
    saveSettingsDebounced();
}

function onRemoveExampleChatSeparatorsChange(event) {
    extensionSettings.removeExampleChatSeparators = Boolean(event.target.checked);
    saveSettingsDebounced();
}

function onResetStoryStringClick(event) {
    document.getElementById('anlatan-nai-extras-storystring-template').value = defaultSettings.storyString;
    extensionSettings.storyString = defaultSettings.storyString;
    saveSettingsDebounced();
}

function onAddBlockClick(event) {
    const labelInput = document.getElementById('anlatan-nai-extras-newblock-label');
    const contentInput = document.getElementById('anlatan-nai-extras-newblock-content');

    const label = labelInput.value;
    const content = contentInput.value;

    if (!label || !content) return;

    extensionSettings.textBlocks.push({
        uuid: uuidv4(),
        label,
        content,
    });

    labelInput.value = '';
    contentInput.value = '';

    saveSettingsDebounced();
    updateTextBlocks();
}

function onRemoveBlockClick(event) {
    extensionSettings.textBlocks = extensionSettings.textBlocks.filter(block => event.target.parentElement.dataset.uuid !== block.uuid);
    saveSettingsDebounced();
    updateTextBlocks();
}

function onRemoveCharAndUserClick(event) {
    extensionSettings.removeCharAndUser = Boolean(event.target.checked);
    saveSettingsDebounced();
}

function updateTextBlocks() {
    const container = document.getElementById('anlatan-nai-extras-textblocks');
    container.innerHTML = '';
    let html = '';

    extensionSettings.textBlocks.forEach((block) => {
        html += `<div class="flex wide100p">
                    <input type="text" value="${block.label}" class="text_pole textarea_compact" placeholder="Block name" disabled/>
                    <div class="anlatan-nai-extras-removeBlock menu_button menu_button_icon" style="margin-left:1em;" data-uuid="${block.uuid}">
                        <i class="fa-xs fa-solid fa-minus"></i>
                        <small data-i18n="Remove" >Remove</small>
                    </div>
                </div>
                <textarea class="text_pole textarea_compact" placeholder="Block content" disabled>${block.content}</textarea>`;
    });

    container.insertAdjacentHTML('beforeend', html);

    Array.from(document.getElementsByClassName('anlatan-nai-extras-removeBlock')).forEach((element) => element.addEventListener('click', onRemoveBlockClick));
}

const removeFromChat = (user, character, chat) => {
    const expression = new RegExp(`^${user}:|${character}:`, 'gm');
    return chat.replace(expression, '');
};

const removeLastOccurrence = (target, str) => {
    const index = target.lastIndexOf(str);

    if (index !== -1 && index === target.length - str.length) {
        return target.substring(0, index);
    }

    return target;
};

async function loadSettings() {
    extension_settings[extensionName] = extension_settings[extensionName] || {};
    if (Object.keys(extension_settings[extensionName]).length === 0) {
        Object.assign(extension_settings[extensionName], defaultSettings);
    }
}

(async function () {
    await loadSettings();
    const settings = extensionSettings;

    const container = document.getElementById('novel_api-settings');
    const naiExtrasHtml = await $.get(`${extensionFolderPath}/NaiExtrasSettings.html`);

    container.insertAdjacentHTML('beforeend', naiExtrasHtml);

    const storyStringTextarea = document.getElementById('anlatan-nai-extras-storystring-template');
    const removeLastMentionOfCharToggle = document.getElementById('anlatan-nai-extras-settings-removeLastMentionOfUser');
    const removeExampleChatSeparators = document.getElementById('anlatan-nai-extras-settings-removeExampleChatSeparators');
    const resetStoryString = document.getElementById('anlatan-nai-extras-resetStoryString');
    const addBlock = document.getElementById('anlatan-nai-extras-addBlock');
    const removeCharAndUser = document.getElementById('anlatan-nai-extras-settings-removeCharAndUser');

    storyStringTextarea.value = settings.storyString;
    removeLastMentionOfCharToggle.checked = settings.removeLastMentionOfChar;
    removeExampleChatSeparators.checked = settings.removeExampleChatSeparators;
    removeCharAndUser.checked = settings.removeCharAndUser;

    extensionsHandlebars.registerHelper('instruct', function (text) {
        if (!text) return '';
        return '{' + text + '}';
    });

    extensionsHandlebars.registerHelper('trim', function (options) {
        return options.fn(this).replace(/\s{3,}/g, ' ').replace(/\n{3,}/g, '\n').trim();
    });

    const orderInput = (data) => {
        if ('novel' !== data.api) return;

        const storyStringTemplate = extensionsHandlebars.compile(`${settings.storyString} {{generatedPromptCache}}`, { noEscape: true });

        let chat = data.finalMesSend
            .map((e) => `${e.extensionPrompts.join('')}${e.message}`)
            .join('')
            .trim();

        if (settings.removeCharAndUser) {
            chat = removeFromChat(data.user, data.char, chat);
        } else {
            if (settings.removeLastMentionOfChar) chat = removeLastOccurrence(chat, `${data.char}:`);
        }

        let examples = data.mesExmString;
        if (settings.removeExampleChatSeparators) examples = examples.replaceAll('***', '');

        const markers = {
            wiBefore: data.beforeScenarioAnchor,
            description: data.description,
            personality: data.personality,
            persona: data.persona,
            wiAfter: data.afterScenarioAnchor,
            examples,
            scenario: data.scenario,
            preamble: data.naiPreamble,
            main: data.main,
            jailbreak: data.jailbreak,
            chat,
            user: data.user,
            char: data.char,
            generatedPromptCache: data.generatedPromptCache,
        };

        settings.textBlocks.forEach((block) => {
             markers[block.label] = block.content;
        });

        data.combinedPrompt = storyStringTemplate(markers).trim();
    };


    eventSource.on(event_types.GENERATE_BEFORE_COMBINE_PROMPTS, orderInput);

    storyStringTextarea.addEventListener('change', onStoryStringChange);
    removeLastMentionOfCharToggle.addEventListener('change', onRemoveLastMentionOfCharChange);
    removeExampleChatSeparators.addEventListener('change', onRemoveExampleChatSeparatorsChange);
    resetStoryString.addEventListener('click', onResetStoryStringClick);
    addBlock.addEventListener('click', onAddBlockClick);
    removeCharAndUser.addEventListener('click', onRemoveCharAndUserClick);

    updateTextBlocks();
})();
