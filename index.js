import { extension_settings } from '../../../extensions.js';
import { event_types, eventSource, main_api, saveSettingsDebounced } from '../../../../script.js';
import { uuidv4 } from '../../../utils.js';

const extensionsHandlebars = Handlebars.create();
const extensionName = 'anlatan-nai-extras';
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
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
await loadSettings();
const extensionSettings = extension_settings[extensionName];

/**
 * Save Story Format
 * @param event
 */
function onStoryStringChange(event) {
    extensionSettings.storyString = event.target.value;
    saveSettingsDebounced();
}

/**
 * Toggles removal of last character name
 * @param event
 */
function onRemoveLastMentionOfCharChange(event) {
    extensionSettings.removeLastMentionOfChar = Boolean(event.target.checked);
    saveSettingsDebounced();
}

/**
 * Saves whether example message should be squashed
 * @param event
 */
function onRemoveExampleChatSeparatorsChange(event) {
    extensionSettings.removeExampleChatSeparators = Boolean(event.target.checked);
    saveSettingsDebounced();
}

/**
 * Resets the Story Format window and settings
 * @param event
 */
function onResetStoryStringClick(event) {
    document.getElementById('anlatan-nai-extras-storystring-template').value = defaultSettings.storyString;
    extensionSettings.storyString = defaultSettings.storyString;
    saveSettingsDebounced();
}

/**
 * Adds a text block to settings and update
 * the text block list
 * @param event
 */
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

/**
 * Removes a text block to settings and updates
 * the text block list
 * @param event
 */
function onRemoveBlockClick(event) {
    extensionSettings.textBlocks = extensionSettings.textBlocks.filter(block => event.target.parentElement.dataset.uuid !== block.uuid);
    saveSettingsDebounced();
    updateTextBlocks();
}

/**
 * Toggles removal of user and character name occurrences
 * @param event
 */
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

const isNai = () => {
    return 'novel' === main_api;
};

const checkAdvancedFormatting = () => {
    if (!isNai) return;

    const contextTemplate = document.getElementById('context_presets').value;
    const element = document.getElementById('anlatan-nai-extras-warning');
    if ('NovelAI' !== contextTemplate) {
        element.classList.add('anlatan-nai-extras-warning-active');
        element.textContent = 'NovelAI template not set. To prevent unwanted formatting go to Advanced Formatting, then select the NovelAI template and disable instruct mode.';
    } else {
        element.classList.remove('anlatan-nai-extras-warning-active');
        element.textContent = '';
    }
};

async function loadSettings() {
    extension_settings[extensionName] = extension_settings[extensionName] || {};
    if (Object.keys(extension_settings[extensionName]).length === 0) {
        Object.assign(extension_settings[extensionName], defaultSettings);
    }
}

(async function () {
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
        if (!isNai) return;

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

    document.getElementById('send_but').addEventListener('click', checkAdvancedFormatting);

    updateTextBlocks();
})();
