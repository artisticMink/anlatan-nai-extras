# Extra settings for NovelAI in SillyTavern

NovelAI's Clio and Kayra models benefit greatly from a context that is tailored to a specific story. NAI Extras attempts to give users more options when composing the context. Making it possible to further edit the context composition, switch between chat and NAI's vanilla story mode, as well as bind certain context compositions to characters without the need for advanced formatting presets. [Example Screnshot](example.png).

Other features include improved support for NAI text adventure mode, character-specific, reusable text blocks for use in context and the ability to insert scene breaks in chat mode. 

* [The Default Template](#the-default-template)
* [Mode](#mode)
* [Chat Format Window](#chat-format-window)
  * [Variables](#variables)
  * [Helpers](#helpers)
  * [Text Blocks](#text-blocks)
* [Scene Breaks](#scene-breaks)
* [Pruning Chat Messages](#pruning-chat-messages)

## The Default Template

NAI Extras comes with a standard template for a simple slice-of-life story in chat format. Customize it to your needs and experiment with it. You can find more information about the possibilities at [NovelAI's documentation](https://docs.novelai.net/text/specialsymbols.html).

Template:
```
{{style "chat" "sfw" "narrative" "detailed" "slice of life"}}
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
{{#if examples}}{{examples}}{{else}}***{{/if}}
{{chat}}
```

Below the result that will be sent, note that `{{#if examples}}{{examples}}{{else}}***{{/if}}` will add a 'new scene' dinkus if there are no examples present. Otherwise the examples will be added, which contain a dinkus at the end already.

```
[ Style: chat, sfw, narrative, detailed, slice of life ]  
----
Charactername:
The character description.
The character personality.
----
Username:
The user's persona.
----
World Information (before)
World Information (after)
*** 
The chat history
```

## Mode

Chat
For chat-style interactions. The default SillyTavern behavior.

Story
For writing stories in which the model acts as co-author. The default NovelAI behavior.

Text Adventure
Improved the function of NovelAI's Text Adventure module. Adds UI elements for dialog and actions and performs pre- and post-processing to make the module work with ST. 

## Chat Format Window
Similar to Advanced Formatting, but tailored for use with NAI. You can use it like NAI's editor. If you leave the text field empty, ST will use its standard formatting method.

### Variables

You can mix regular text and variables. The following pre-defined variables are available:
```
<!-- From SillyTavern -->
{{user}} - Name of the selected persona
{{char}} - Name of the selected character
{{main}} - The cards custom main prompt
{{jailbreak}} - The cards custom jailbreak prompt
{{wiBefore}} - Worldinformation Before
{{wiAfter}} - Worldinformation After
{{scenarioBefore}} - Information with the 'before scenario' setting. Extensions etc.
{{scenarioAfter}} - Information with the 'after scenario' setting. Includes Summary.
{{description}} - Character Description
{{personality}} - Character Personality
{{persona}} - Description of the selected persona
{{examples}} - Chat Examples
{{scenario}} - Character Scenario
{{chat}} - The chat history

<!-- NAI specific -->
{{preamble}} - The Preamble
{{new_story}}, {{nst}} - ⁂
{{new_scene}}, {{ns}} - ***
{{en}} - En space
{{em}} - Em space
```

### Helpers

Helpers are for quickly adding some of NovelAI's [Advanced Symbols](https://docs.novelai.net/text/specialsymbols.html) without having to care about correct spacing of brackets or placement of commas. They can be combined with text block variables and the built-in [handlebar helpers](https://handlebarsjs.com/guide/builtin-helpers.html).

This example will format the character and persona description as Information:
```
{{info description}}
```
Output:
```
----
Character card description
***
```
Helper accept multiple arguments.
```
{{instruct main jailbreak myVariable "Gooseattack!"}}
```
Output:
```
{ <content of character main prompt override> } { <content of character jailbreak prompt override> } { <content of myVariable> } { Gooseattack! }
```
Complex helpers can be formatted for easier readability:
```
 {{ multiBracket 
 "Knowledge" "Spaceship Engines" 
 "Style" "science-fiction, technobabble, nerdy"
 }}
```

Helpers are only for convenience and do not need to be used. All formatting can be done in the Story Format Window directly.

#### Instruct
Every variable can be formatted as instruction by appending 'instruct'. For example `{{instruct description}}` will format the character description as instruction. NovelAI's official documentation has more information on Clio's and Kayra's [instruct capabilities](https://docs.novelai.net/text/specialmodules.html).

Shorthand: in

Template:
```
{{instruct main}}
```
Output:
```
{ <system prompt override text> }
```

#### Info
Shorthand: i

Template:
```
{{info description }}
{{info wiBefore description wiAfter "My summary of the events so far"}}
```
Output:
```
----
<description content>
***

----
<wiBefore content>
----
<description content>
----
<wiAfter content>
----
"My summary of the events so far"
***
```

#### Bracket
Shorthand:b

Template:
```
{{bracket "Knowledge" "anime in 80s" "Macross" "Mecha"}}
{bracket "Five Minutes Later"}}
```
Output:
```
[ Knowledge: anime in 80s, Macross, Mecha ]
[ Five Minutes Later ]
```

#### MultiBracket
Shorthand: mb

Template:
```
{{multiBracket "Knowledge" "Spaceship Engines" "Style" "science-fiction, technobabble, nerdy"}}
```
Output:
```
[ Knowledge: Spaceship Engines ; Style: science-fiction, technobabble, nerdy]
```

#### ATTG
Shorthand: a

Template:
```
{{attg "Joe R.R. Martinez" "Dragons with Top-hats" "London, 1820s, dragons" "steampunk, drama"}}
```
Output:
```
[ Author: Joe R.R. Martinez; Title: Dragons with Top-hats; Tags: London, 1820s, dragons; Genre: steampunk, drama ]
```

#### Knowledge
Shorthand: k

Template:
```
{{knowledge "anime in the 90s"}}
```
Output:
```
[ Knowledge: anime in the 90s ]
```

#### Style
Shorthand: s

Template:
```
{{style "chat" "sfw" "detailed"}}
```
Output:
```
[ Style: chat, sfw, detailed ]
```

#### Stat
Shorthand: st

Template:
```
{{stat "You gained a new perk: Dragon's breath"}}
```
Output:
```
─ You gained a new perk: Dragon's breath
```

#### Trim
Shorthand: t

When using line breaks to keep the Story Format Window readable or generally having messy information, the `{{#trim}}{{/trim}}` helper can be used to tidy up the text. It will remove multiple line breaks and empty spaces.

Template:
```
{{#trim}}
{{description}}

{{personality}}
{{persona}}

These are some short storys related to the plot:
{{examples}}
{{/trim}}
***
{{preamble}}
{{chat}}
{Write in the style of a light novel}
```

### Pruning Chat Messages

Non-ST variables are not taken into account in the token limit of the models. Normally, you have a margin of about 200 tokens, even with a full chat history, which is sufficient for simple instructions or information. However, when adding large amounts of text or extended symbols, NAI might not generate an answer because the context exceeds the token count of the model. To prevent this, you can remove some messages from the chat history. For example, if you enter the value 3, the 3 oldest chat messages will be removed, freeing up some tokens for your instructions or text blocks.

## Scene Breaks

Navigate to the options menu on the left side of the chat input and select `NAI - New Scene` to insert a scene break into the chat history.

A dinkus `***` helps the model to understand that a scene break takes place. In chat mode, placing a dinkus in the chat message will not work as it creates a message like this: `Username: *** sometext`. Using the new scene button will insert a separate message which only contains the dinkus in a single new line, enabling the model to recognize it.

## Text Blocks
Define variables for use within the context.

Example:
```
Block Name: Geesepocalypse
Block Content: Incorporate the following plot point into the story: Suddenly, a myriad of wild geese appear on the horizon and swoop down on our unsuspecting heroes. They honk wildly as they approach.
```
``` 
{{description}}
{{persona}}
***
{{preamble}}
{{chat}}
{{instruct Geesepocalypse}}
```
