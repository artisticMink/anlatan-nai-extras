# Extra settings for NovelAI in SillyTavern

* Format NAI context yourself.
* Quickly parts of your context as instructions.
* Add re-usable text-blocks to use in your context.
* Use novel-style or chat-style formatting for your chat.

### Context Formatting
#### Story Format Window
The Story Format window allows you to compose your own context. If you leave the window empty, ST's default formatting will be used. A simple context might look like this:
```
{{description}}
{{persona}}
***
{{preamble}}
{{chat}}
```
You can mix regular text and variables. The following variables can be used:
```
{{user}} - Name of the selected persona
{{char}} - Name of the selected character
{{main}} - The cards custom main prompt
{{jailbreak}} - The cards custom jailbreak prompt
{{wiBefore}} - Worldinformation Before
{{wiAfter}} - Worldinformation After
{{description}} - Character Description
{{personality}} - Character Personality
{{persona}} - Description of the selected persona
{{examples}} - Chat Examples
{{scenario}} - Character Scenario
{{preamble}} - The Preamble
{{chat}} - The chat history
```
Every variable can be formatted as instruction by appending 'instruct'. For example `{{instruct description}}` will format the character description as instruction. Clios and Kayras instruct capabillities are different to other common models and formatting everything as instruction will not necessairly improve the output though. However, they work very well with short, direct instructions at the very end of the context. 

A good practice is to use the characters main prompt override to keep the model focused on a certain writing style or scene and then include it in the context like so:
```
{{description}}
{{persona}}
***
{{preamble}}
{{chat}}
{{instruct main}}
```
You can also use [handlebar helpers](https://handlebarsjs.com/guide/builtin-helpers.html).

#### Permanent Text Blocks
Here you can define your own variables for use within the context.

Example:
```
Block Name: Geesepocalypse
Block Content: Incorporate the following plot point into the story: Suddenly, a myriad of wild geese appear on the horizon and swoop down on our unsuspecting heroes. They honk wildly as they approach..
```
``` 
{{description}}
{{persona}}
***
{{preamble}}
{{chat}}
{{instruct Geesepocalypse}}
```
