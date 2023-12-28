# Extra settings for NovelAI in SillyTavern

* Compose the NAI context yourself.
* Quickly format blocks of context as instruction.
* Add re-usable blocks to use in your context.
* Switch between novel-style or chat-style formatting.

### Context Formatting
#### Story Format Window
This is similar to Advanced Formatting. Leaving the input empty will cause ST to use its default formatting method. 

A simple context might look like this:
```
{{description}}
{{persona}}
***
{{preamble}}
{{chat}}
```

Placing `***` within the context tells the model that the story will begin at this point.

You may mix regular text and variables. The following variables can be used:
```
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
{{preamble}} - The Preamble
{{chat}} - The chat history
```
Every variable can be formatted as instruction by appending 'instruct'. For example `{{instruct description}}` will format the character description as instruction. NovelAI's official documentation has more information on Clio's and Kayra's [instruct capabilities](https://docs.novelai.net/text/specialmodules.html).

In this example, the characters main prompt override is used to tell the model how to handle the next reply:
```
{{description}}
{{persona}}
***
{{preamble}}
{{chat}}
{{instruct main}}
```
It is also possible to use [handlebar helpers](https://handlebarsjs.com/guide/builtin-helpers.html).

#### Text Blocks
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

### Utility

When using line breaks to keep the Story Format Window readable or generally having messy information, the `{{#trim}}{{/trim}}` helper can be used to tidy up the text. It will remove multiple line breaks and empty spaces.

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
