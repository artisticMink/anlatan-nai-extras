import { extension_settings } from '../../../extensions.js';
import {
    callPopup,
    characters,
    event_types,
    eventSource,
    main_api,
    saveSettingsDebounced, sendTextareaMessage, substituteParams,
    this_chid,
} from '../../../../script.js';
import { uuidv4 } from '../../../utils.js';

class NaiMode {
    static CHAT = 1;
    static STORY = 2;
    static ADVENTURE = 3;
}

const extensionsHandlebars = Handlebars.create();
const extensionName = 'anlatan-nai-extras';
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
const defaultSettings = {
    removeLastMentionOfChar: false,
    removeExampleChatSeparators: false,
    mode: NaiMode.CHAT,
    pruneChatBy: 0,
    textBlocks: [],
    characters: {},
    storyString: `⁂
{{preamble}}
----
{{char}}:
{{description}}
{{personality}}
----
{{user}}:
{{persona}}
----
{{wiBefore}}
{{wiAfter }}
{{#if examples}} {{examples}} {{else}} *** {{/if}}
{{chat}}`,
};

loadSettings();
let extensionSettings = extension_settings[extensionName];

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
 * Sets chat messages to be pruned from end of the chat
 * @param event
 */
function onChatPruneChange(event) {
    extensionSettings.pruneChatBy = Number(event.target.value);
    saveSettingsDebounced();
}

function onSaveToCharacterClick() {
    if (!this_chid) return;

    const popupMessage = `
<br>
<p>
<b>Bind the current settings to the selected character?</b>
</p>
<p>
Your settings are copied to this character and loaded whenever this character is selected. If you change the character name, your settings will be lost.
</p>`;
    callPopup(popupMessage, 'confirm').then(accept => {
        if (true !== accept) return;

        copySettingsToCharacterSettings(this_chid);
        swapSettingsSource(this_chid);
        saveSettingsDebounced();
    });
}

function copySettingsToCharacterSettings(characterId) {
    const name = characters[characterId].data.name;
    const characterSettings = structuredClone(extensionSettings);
    delete characterSettings.characters;
    extension_settings[extensionName].characters[name] = characterSettings;
}

function swapSettingsSource(characterId = null) {
    if (!isNai) return;

    swapToDefaultSettings();

    if (characterId) {
        const characterName = characters[characterId].data.name;
        if (Object.prototype.hasOwnProperty.call(extensionSettings.characters, characterName)) {
            extensionSettings = extensionSettings.characters[characterName];
            document.getElementById('anlatan-nai-extras-characterSelected').textContent = characterName;
        }
    }

    updateUi();
}

function swapToDefaultSettings() {
    extensionSettings = extension_settings[extensionName];
    document.getElementById('anlatan-nai-extras-characterSelected').textContent = 'Default';
}

function updateUi() {
    const storyStringTextarea = document.getElementById('anlatan-nai-extras-storystring-template');
    const removeLastMentionOfCharToggle = document.getElementById('anlatan-nai-extras-settings-removeLastMentionOfUser');
    const removeExampleChatSeparators = document.getElementById('anlatan-nai-extras-settings-removeExampleChatSeparators');
    const chatPrune = document.getElementById('anlatan-nai-extras-chatPrune');
    const naiModeSelect = document.getElementById('anlatan-nai-extras-mode');

    storyStringTextarea.value = extensionSettings.storyString;
    removeLastMentionOfCharToggle.checked = extensionSettings.removeLastMentionOfChar;
    removeExampleChatSeparators.checked = extensionSettings.removeExampleChatSeparators;
    chatPrune.value = extensionSettings.pruneChatBy;
    naiModeSelect.value = extensionSettings.mode ?? NaiMode.CHAT;

    setupTextAdventure();
    updateTextBlocks();
}

/**
 * Empties and fills the text block container.
 */
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

/**
 * Removes the chat-style formatting from the given chat.
 *
 * @param user
 * @param character
 * @param chat
 * @returns {*}
 */
const removeFromChat = (user, character, chat) => {
    const expression = new RegExp(`^${user}: ?|${character}: ?`, 'gm');
    return chat.replace(expression, '');
};

/**
 * Removes the last occurrence of target from the given string.
 *
 * @param target
 * @param str
 * @returns {*|string}
 */
const removeLastOccurrence = (target, str) => {
    const index = target.lastIndexOf(str);

    if (index !== -1 && index === target.length - str.length) {
        return target.substring(0, index);
    }

    return target;
};

/**
 * Whether NovelAI API is currently selected
 *
 * @returns {boolean}
 */
const isNai = () => {
    return 'novel' === main_api;
};

/**
 * Check if Advanced Formatting is set to the NovelAI preset and
 * instruct mode is disabled. Show a visual hint otherwise.
 */
const checkAdvancedFormatting = () => {
    if (!isNai) return;

    const contextTemplate = document.getElementById('context_presets').value;
    const instructEnabled = document.getElementById('instruct_enabled').checked;
    const element = document.getElementById('anlatan-nai-extras-warning');

    if ('NovelAI' !== contextTemplate || true === instructEnabled) {
        element.classList.add('anlatan-nai-extras-warning-active');
        element.textContent = 'NovelAI template not set. To prevent unwanted formatting go to Advanced Formatting, then select the NovelAI template and disable instruct mode.';
    } else {
        element.classList.remove('anlatan-nai-extras-warning-active');
        element.textContent = '';
    }
};

/**
 * Populate extension settings
 */
function loadSettings() {
    extension_settings[extensionName] = extension_settings[extensionName] || {};

    const extensionKeys = Object.keys(extension_settings[extensionName]);
    const defaultKeys = Object.keys(defaultSettings);

    for (const key of defaultKeys) {
        if (!extensionKeys.includes(key)) {
            extension_settings[extensionName][key] = defaultSettings[key];
        }
    }
}

function setupHelpers() {

    /**
     * Usage: {{instruct main}}
     * Output: { <system prompt override text> }
     */
    function instructHelper(...args) {
        if (args && !args[0]) return '';
        args.pop();
        return args.map(item => `{ ${item} }`).join(' ');
    }

    /**
     * Usage: {{info description}}
     * Output: ----
     *         <description content>
     *         ***
     */
    function infoHelper(...args) {
        if (args && !args[0]) return '';
        args.pop();
        const information = args.filter(item => '' !== item).map(item => `----\n ${item}`).join('\n');
        return information ? information + '\n***' : '';
    }

    /**
     * Usage:   {{bracket "Knowledge" "anime in 80s" "Macross" "Mecha"}}
     *          {{bracket "Knowledge" myTextBlock}}
     *          {{bracket "Style" "chat" "sfw" "detailed"}}
     *          {{bracket "Five Minutes Later"}}
     *
     * Output: [ Knowledge: anime in 80s, Macross, Mecha ]
     */
    function bracketsHelper(...args) {
        if (args && !args[0]) return '';
        const first = args.shift();
        args.pop();
        if (!args.length) {
            return `[ ${first} ]`;
        }
        return `[ ${first}: ${args.join(', ')} ]`;
    }

    /**
     * Usage:  {{multiBracket "Knowledge" "Spaceship Engines" "Style" "science-fiction, technobabble, nerdy"}}
     * Output: [ Knowledge: Spaceship Engines ; Style: science-fiction, technobabble, nerdy]
     */
    function multiBracketHelper(...args) {
        if (args && !args[0]) return '';
        args.pop();
        let output = '';
        let index = 0;
        args.forEach((value) => {
            if (index % 2 === 0) {
                output += `${args[index]}: ${args[index + 1]} ; `;
            }
            index++;
        });
        return `[ ${output.substring(0, output.length - 3)} ]`;
    }

    /**
     * Usage: {{knowledge "anime in 90s"}}
     * Output: [ Knowledge: anime in 90s ]
     */
    function knowledgeHelper(...args) {
        if (args && !args[0]) return '';
        args.pop();
        return `[ Knowledge: ${args.join(', ')} ]`;
    }

    /**
     * Usage: {{attg "Joe R.R. Martinez" "Dragons with Top-hats" "London, 1820s, dragons" "steampunk, drama"}}
     * Output: [ Author: Joe R.R. Martinez; Title: Dragons with Top-hats; Tags: London, 1820s, dragons; Genre: steampunk, drama ]
     */
    function attgHelper(author, title, tags, genre) {
        if (!author && !title && !tags && !genre) return '';
        return `[ Author: ${author}; Title: ${title}; Tags: ${tags}; Genre: ${genre} ]`;
    }

    /**
     * Usage: {{style "chat" "sfw" "detailed"}}
     * Output: [ Style: chat, sfw, detailed ]
     */
    function styleHelper(...args) {
        if (args && !args[0]) return '';
        args.pop();
        if (!args) return '';
        return `[ Style: ${args.join(', ')} ]`;
    }

    /**
     * Usage: {{new_scene}}
     * Output: ***
     */
    function newSceneHelper(text) {
        return '***';
    }

    /**
     * Usage: {{new_story}}
     * Output: ⁂
     */
    function newStoryHelper(text) {
        return '⁂';
    }

    /**
     * Usage: {{en}}
     * Output:  
     */
    function enHelper() {
        return ' ';
    }

    /**
     * Usage: {{em}}
     * Output:  
     */
    function emHelper() {
        return ' ';
    }

    /**
     * Usage: {{stat "You gained a new perk: Dragon's breath"}}
     * Output: ─ You gained a new perk: Dragon's breath
     */
    function statHelper(text) {
        return `─ ${text}`;
    }

    /**
     * Usage: {{#trim}}<content>{{/trim}}
     * Output: <content> with trimmed spaces and double, or more, spaces/line breaks removed.
     */
    function trimHelper(options) {
        return options.fn(this).replace(/\s{3,}/g, ' ').replace(/\n{3,}/g, '\n').trim();
    }

    /**
     * Usage: {{concat "Foo" "Bar"}}
     * Output: Foo Bar
     */
    function concatHelper(...args) {
        args.pop();
        if (2 > args.filter(item => '' !== item).length) return '';
        return args.join(' ');
    }

    extensionsHandlebars.registerHelper('instruct', instructHelper);
    extensionsHandlebars.registerHelper('in', instructHelper);

    extensionsHandlebars.registerHelper('info', infoHelper);
    extensionsHandlebars.registerHelper('i', infoHelper);

    extensionsHandlebars.registerHelper('brackets', bracketsHelper);
    extensionsHandlebars.registerHelper('b', bracketsHelper);

    extensionsHandlebars.registerHelper('multiBracket', multiBracketHelper);
    extensionsHandlebars.registerHelper('mb', multiBracketHelper);

    extensionsHandlebars.registerHelper('knowledge', knowledgeHelper);
    extensionsHandlebars.registerHelper('k', knowledgeHelper);

    extensionsHandlebars.registerHelper('attg', attgHelper);
    extensionsHandlebars.registerHelper('a', attgHelper);

    extensionsHandlebars.registerHelper('style', styleHelper);
    extensionsHandlebars.registerHelper('s', styleHelper);

    extensionsHandlebars.registerHelper('new_scene', newSceneHelper);
    extensionsHandlebars.registerHelper('ns', newSceneHelper);

    extensionsHandlebars.registerHelper('new_story', newStoryHelper);
    extensionsHandlebars.registerHelper('nst', newStoryHelper);

    extensionsHandlebars.registerHelper('en', enHelper);

    extensionsHandlebars.registerHelper('em', emHelper);

    extensionsHandlebars.registerHelper('stat', statHelper);
    extensionsHandlebars.registerHelper('st', statHelper);

    extensionsHandlebars.registerHelper('trim', trimHelper);
    extensionsHandlebars.registerHelper('t', trimHelper);

    extensionsHandlebars.registerHelper('concat', concatHelper);
    extensionsHandlebars.registerHelper('c', concatHelper);
}

function orderInput(data) {
    if (!isNai) return;

    const storyStringTemplate = extensionsHandlebars.compile(`${extensionSettings.storyString} {{generatedPromptCache}}`, { noEscape: true });
    const chatData = structuredClone(data.finalMesSend);

    if (extensionSettings.pruneChatBy) chatData.splice(0, extensionSettings.pruneChatBy);

    let chat = chatData
        .map((e) => `${e.extensionPrompts.join('')}${e.message}`)
        .join('');

    if (storyMode() || adventureMode()) {
        chat = removeFromChat(data.user, data.char, chat);
    } else {
        if (extensionSettings.removeLastMentionOfChar) chat = removeLastOccurrence(chat, `${data.char}:`);
    }

    let examples = data.mesExmString;
    if (extensionSettings.removeExampleChatSeparators) examples = examples.replaceAll('***', '');

    const markers = {
        description: data.description,
        personality: data.personality,
        persona: data.persona,
        wiBefore: data.worldInfoBefore,
        wiAfter: data.worldInfoAfter,
        scenarioBefore: data.beforeScenarioAnchor,
        scenarioAfter: data.afterScenarioAnchor,
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

    extensionSettings.textBlocks.forEach((block) => {
        markers[block.label] = block.content;
    });

    let combinedPrompt = storyStringTemplate(markers).trim();

    combinedPrompt = substituteParams(combinedPrompt, data.user, data.char, null, null);

    data.combinedPrompt = combinedPrompt;
}

function storyMode() {
    return NaiMode.STORY === extensionSettings.mode;
}

function chatMode() {
    return NaiMode.CHAT === extensionSettings.mode;
}

function adventureMode() {
    return NaiMode.ADVENTURE === extensionSettings.mode;
}

function setupTextAdventure() {
    document.getElementById('anlatan-nai-extras-send-action')?.remove();
    document.getElementById('anlatan-nai-extras-send-dialogue')?.remove();

    const naiPrefixSelect = document.getElementById('nai_prefix');
    if (false === adventureMode()) {
        if ('theme_textadventure' === naiPrefixSelect.value) {
            naiPrefixSelect.value = 'vanilla';
            naiPrefixSelect.dispatchEvent(new Event('change'));
        }
    } else if ('theme_textadventure' !== naiPrefixSelect.value) {
        naiPrefixSelect.value = 'theme_textadventure';
        naiPrefixSelect.dispatchEvent(new Event('change'));
    }

    const sendButton = document.getElementById('send_but');
    const actionButton = '<div id="anlatan-nai-extras-send-action" class="fa-solid fa-running" title="Make an action" data-i18n="[title]Make an action"></div>';
    sendButton.insertAdjacentHTML('beforebegin', actionButton);
    document.getElementById('anlatan-nai-extras-send-action').addEventListener('click', () => {
        const sendTextarea = document.getElementById('send_textarea');
        const text = sendTextarea.value;

        if (text === 'l') {
            sendTextarea.value = '> You look around.';
        } else if (text === 'i') {
            sendTextarea.value = '> You check your inventory.';
        } else if (text.startsWith('x')) {
            sendTextarea.value = `> You examine ${text.replace('x', '').trim()}.`;
        } else if (text === 'w') {
            sendTextarea.value = '> You wait.';
        } else {
            sendTextarea.value = `> You ${text}.`;
        }

        sendTextareaMessage();
    });

    const dialogueButton = '<div id="anlatan-nai-extras-send-dialogue" class="fa-solid fa-comment" title="Say something" data-i18n="[title]Say something"></div>';
    sendButton.insertAdjacentHTML('beforebegin', dialogueButton);
    document.getElementById('anlatan-nai-extras-send-dialogue').addEventListener('click', () => {
        const sendTextarea = document.getElementById('send_textarea');
        let text = sendTextarea.value;

        if (true === isLastChar(text, '?')) text = `> You ask "${text}."`;
        else if (true === isLastChar(text, '!')) text = `> You yell "${text}."`;
        else text = `> You say "${text}."`;

        sendTextarea.value = text;

        sendTextareaMessage();
    });
}

function isLastChar(input, character) {
    if (input.length === 0) {
        return false;
    }

    const lastChar = input.slice(-1);

    return character === lastChar;
}

function onNaiModeChange(event) {
    if (!isNai) return;

    extensionSettings.mode = Number(event.target.value);
    saveSettingsDebounced();

    updateUi();
}

function init() {
    const container = document.getElementById('novel_api-settings');
    const naiExtrasHtml = await $.get(`${extensionFolderPath}/NaiExtrasSettings.html`);

    container.insertAdjacentHTML('beforeend', naiExtrasHtml);

    updateUi();
    setupHelpers();

    eventSource.on(event_types.GENERATE_BEFORE_COMBINE_PROMPTS, orderInput);
    eventSource.on(event_types.GENERATE_BEFORE_COMBINE_PROMPTS, checkAdvancedFormatting);
    eventSource.on(event_types.MESSAGE_SWIPED, checkAdvancedFormatting);
    eventSource.on(event_types.CHAT_CHANGED, () => swapSettingsSource(this_chid));
    eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, (chatId) => {
        if (adventureMode()) {
            // Every time this function is executed, a puppy dies on planet earth.
            const sleep = ms => new Promise(r => setTimeout(r, ms));
            document.querySelector('.last_mes .mes_edit').click();
            sleep(50);
            document.getElementById('curEditTextarea').value = document.getElementById('curEditTextarea').value.replace('\n>', '');
            sleep(50);
            document.querySelector('.last_mes .mes_edit_done').click();
        }
    });

    const storyStringTextarea = document.getElementById('anlatan-nai-extras-storystring-template');
    const removeLastMentionOfCharToggle = document.getElementById('anlatan-nai-extras-settings-removeLastMentionOfUser');
    const removeExampleChatSeparators = document.getElementById('anlatan-nai-extras-settings-removeExampleChatSeparators');
    const resetStoryString = document.getElementById('anlatan-nai-extras-resetStoryString');
    const addBlock = document.getElementById('anlatan-nai-extras-addBlock');
    const chatPrune = document.getElementById('anlatan-nai-extras-chatPrune');
    const saveToCharacter = document.getElementById('anlatan-nai-extras-saveToCharacter');
    const naiModeSelect = document.getElementById('anlatan-nai-extras-mode');

    storyStringTextarea.addEventListener('change', onStoryStringChange);
    removeLastMentionOfCharToggle.addEventListener('change', onRemoveLastMentionOfCharChange);
    removeExampleChatSeparators.addEventListener('change', onRemoveExampleChatSeparatorsChange);
    resetStoryString.addEventListener('click', onResetStoryStringClick);
    addBlock.addEventListener('click', onAddBlockClick);
    chatPrune.addEventListener('change', onChatPruneChange);
    saveToCharacter.addEventListener('click', onSaveToCharacterClick);
    naiModeSelect.addEventListener('change', onNaiModeChange);

    updateTextBlocks();

    naiExtrasInitialized = true;
}

let naiExtrasInitialized = false;

/**
 * Entry point for extension
 */
(async function () {
    console.log('Foo')
    if (isNai()) init();
    else eventSource.on(event_types.CHATCOMPLETION_SOURCE_CHANGED, () => {
        if (isNai() && !naiExtrasInitialized) init();
    })
})();
