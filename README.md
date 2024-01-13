# Extra settings for NovelAI in SillyTavern

NAI Extras is a small extension for SillyTavern that takes over after Advanced Formatting. It allows you to further edit the context composition, switch between chat, story and text adventure mode as well as bind specific context compositions to characters and declare re-usable textblocks. [Example Screnshot](example.png).

* [Mode](#mode)
* [Chat Format Window](#chat-format-window)
  * [Variables](#variables)
  * [Helpers](#helpers)
  * [Text Blocks](#text-blocks)
* [Pruning Chat Messages](#pruning-chat-messages)

## Mode

Chat
For chat-style interactions. The default SillyTavern behavior.

Story
For writing stories where the model picks up where you left of. The default NovelAI behavior.

Text Adventure
For interaction with NovelAIs Text Adventure module enabled. This mode will perform some pre- and post-processing to make the module work with ST.

## Chat Format Window
This is similar to Advanced Formatting. Leaving the textarea empty will cause ST to use its default formatting method.

A simple context might look like this:
```
⁂
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
{{#if examples}}{{examples}}{{else}}***{{/if}}
{{chat}}
```

Placing `⁂` within the context tells the model that the story will begin at this point. More information is available here: [NovelAI documentation](https://docs.novelai.net/text/specialsymbols.html)

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

NAI Helpers make it easy to format text and especially the content of variables with to NovelAI's [Advanced Symbols](https://docs.novelai.net/text/specialsymbols.html). It is also possible to use the built-in [handlebar helpers](https://handlebarsjs.com/guide/builtin-helpers.html).

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

Non-ST variables are not considered in the token limit of the models. Normally, you have ~200 tokens of headroom, even with a full chat history, which is sufficient for simple instructions or information. However, if you add large amounts of text or extended symbols, NAI might throw an error because you exceed the model's token count. To prevent this, you can remove a few messages from the chat history. For example, if you enter the value 3, the 3 oldest chat messages will be removed, freeing up some tokens for your instructions or text blocks.

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
