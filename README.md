# Extra Options for Novel AI

### What does it do? 

It gives you the options to:
* Format the context yourself.
* Add re-usable text-blocks to use in your context.
* Use novel-style or chat-style formatting for your chat.

### Context Formatting
#### Story Format Window
The Story Format window allows you to compose your own context. If you leave the window empty, ST's default formatting will be used. 

You can write text directly as well as use the following markers:
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
Every marker can be formatted as instruction by appending 'instruct'. For example {{instruct description}} will format the character description as instruction.

#### Permanent Text Blocks
Here you are able to define custom text blocks to use above. Blocks can be used like markers with or without instruct formatting.

Example:
```
Block Name: Geesepocalypse
Block Content: Incorporate the following plot point into the story: Suddenly, a myriad of wild geese appear on the horizon and swoop down on our unsuspecting heroes. They honk wildly as they approach..
```
``` 
***
{{preamble}}
{{chat}}
{{instruct Geesepocalypse}}
```
