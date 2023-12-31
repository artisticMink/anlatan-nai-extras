import { extension_settings } from '../../../extensions.js';
import {
    callPopup,
    characters,
    event_types,
    eventSource,
    main_api,
    saveSettingsDebounced,
    this_chid,
} from '../../../../script.js';
import { uuidv4 } from '../../../utils.js';

const extensionsHandlebars = Handlebars.create();
const extensionName = 'anlatan-nai-extras';
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
const defaultSettings = {
    removeLastMentionOfChar: false,
    removeExampleChatSeparators: false,
    removeCharAndUser: false,
    pruneChatBy: 0,
    textBlocks: [],
    characters: {},
    storyString: `{{wiBefore}}
{{description}}
{{personality}}
{{persona}}
{{wiAfter}}
{{examples}}
{{scenarioBefore}}
{{scenario}}
{{scenarioAfter}}
⁂
{{preamble}}
{{instruct main}}
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
 * Toggles removal of user and character name occurrences
 * @param event
 */
function onRemoveCharAndUserClick(event) {
    extensionSettings.removeCharAndUser = Boolean(event.target.checked);
    saveSettingsDebounced();
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

function swapSettingsSource(characterId) {
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

function updateUi () {
    const storyStringTextarea = document.getElementById('anlatan-nai-extras-storystring-template');
    const removeLastMentionOfCharToggle = document.getElementById('anlatan-nai-extras-settings-removeLastMentionOfUser');
    const removeExampleChatSeparators = document.getElementById('anlatan-nai-extras-settings-removeExampleChatSeparators');
    const removeCharAndUser = document.getElementById('anlatan-nai-extras-settings-removeCharAndUser');
    const chatPrune = document.getElementById('anlatan-nai-extras-chatPrune');

    storyStringTextarea.value = extensionSettings.storyString;
    removeLastMentionOfCharToggle.checked = extensionSettings.removeLastMentionOfChar;
    removeExampleChatSeparators.checked = extensionSettings.removeExampleChatSeparators;
    removeCharAndUser.checked = extensionSettings.removeCharAndUser;
    chatPrune.value = extensionSettings.pruneChatBy;

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
    const expression = new RegExp(`^${user}:|${character}:`, 'gm');
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
        return args.map(item => item ? `----\n ${item}` : null).join('\n') + '\n***';
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
}

function orderInput (data) {
    if (!isNai) return;

    const storyStringTemplate = extensionsHandlebars.compile(`${extensionSettings.storyString} {{generatedPromptCache}}`, { noEscape: true });

    const chatData = structuredClone(data.finalMesSend);

    if (extensionSettings.pruneChatBy) chatData.splice(0, extensionSettings.pruneChatBy);

    let chat = chatData
        .map((e) => `${e.extensionPrompts.join('')}${e.message}`)
        .join('')
        .trim();

    if (extensionSettings.removeCharAndUser) {
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

    data.combinedPrompt = storyStringTemplate(markers).trim();
}

/**
 * Entry point for extension
 */
(async function () {
    const container = document.getElementById('novel_api-settings');
    const naiExtrasHtml = await $.get(`${extensionFolderPath}/NaiExtrasSettings.html`);

    container.insertAdjacentHTML('beforeend', naiExtrasHtml);

    updateUi();
    setupHelpers();

    eventSource.on(event_types.GENERATE_BEFORE_COMBINE_PROMPTS, orderInput);
    eventSource.on(event_types.GENERATE_BEFORE_COMBINE_PROMPTS, checkAdvancedFormatting);
    eventSource.on(event_types.MESSAGE_SWIPED, checkAdvancedFormatting);
    eventSource.on(event_types.CHAT_CHANGED, () => swapSettingsSource(this_chid));

    const storyStringTextarea = document.getElementById('anlatan-nai-extras-storystring-template');
    const removeLastMentionOfCharToggle = document.getElementById('anlatan-nai-extras-settings-removeLastMentionOfUser');
    const removeExampleChatSeparators = document.getElementById('anlatan-nai-extras-settings-removeExampleChatSeparators');
    const resetStoryString = document.getElementById('anlatan-nai-extras-resetStoryString');
    const addBlock = document.getElementById('anlatan-nai-extras-addBlock');
    const removeCharAndUser = document.getElementById('anlatan-nai-extras-settings-removeCharAndUser');
    const chatPrune = document.getElementById('anlatan-nai-extras-chatPrune');
    const saveToCharacter = document.getElementById('anlatan-nai-extras-saveToCharacter');

    storyStringTextarea.addEventListener('change', onStoryStringChange);
    removeLastMentionOfCharToggle.addEventListener('change', onRemoveLastMentionOfCharChange);
    removeExampleChatSeparators.addEventListener('change', onRemoveExampleChatSeparatorsChange);
    resetStoryString.addEventListener('click', onResetStoryStringClick);
    addBlock.addEventListener('click', onAddBlockClick);
    removeCharAndUser.addEventListener('click', onRemoveCharAndUserClick);
    chatPrune.addEventListener('change', onChatPruneChange);
    saveToCharacter.addEventListener('click', onSaveToCharacterClick);

    updateTextBlocks();
})();
