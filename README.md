# Adds extra settings for NovelAI in SillyTavern

### With this extension you can

* Format the context yourself.
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
Every variable can be formatted as instruction by appending 'instruct'. For example {{instruct description}} will format the character description as instruction.

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
