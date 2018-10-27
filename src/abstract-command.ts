import {Conversation, ConversationResponse} from "./conversation"
import * as ora from "ora"
import * as fs from "fs"
import * as path from "path"

const opn = require("opn")
const player = require("play-sound")()

export abstract class AbstractCommand {

    _conversation: Conversation
    _level: string
    _screen: string
    _audio: string
    _outputDirectory: string

    protected constructor(conversation: Conversation, level: string, screen: string, audio: string, output: string) {
        this._conversation = conversation
        this._level = level
        this._screen = screen
        this._audio = audio
        this._outputDirectory = output
    }

    _output(messages: (string | ConversationResponse)[]): void {
        messages.forEach((message: string | ConversationResponse) => {
            if (message instanceof Object && this._level === "simple") {
                const displayText = (message as ConversationResponse).displayText
                if (displayText) {
                    displayText.forEach((text: string) => {
                        console.log(text)
                    })
                } else {
                    console.log("(no response)")
                }
            } else {
                console.log(message)
            }
            if (this._screen !== "off") {
                const screenOut = (message as ConversationResponse).screenOut
                if (screenOut) {
                    if (this._screen === "file" || this._screen === "play") {
                        const filename = path.join(this._outputDirectory, `actions-tools-${Date.now()}.html`)
                        fs.writeFileSync(filename, screenOut.data)
                        console.log(`(The HTML file of the screen_out.data created. ${filename})`)
                        if (this._screen === "play") {
                            opn(filename)
                        }
                    }
                }
            }
            if (this._audio !== "off") {
                const audioOut = (message as ConversationResponse).audioOut
                if (audioOut) {
                    if (this._audio === "file" || this._audio === "play") {
                        const filename = path.join(this._outputDirectory, `actions-tools-${Date.now()}.mp3`)
                        audioOut.forEach((audioData, i) => {
                            if (i === 0) {
                                fs.writeFileSync(filename, audioData)
                            } else {
                                fs.appendFileSync(filename, audioData)
                            }
                        })
                        console.log(`(The MP3 file of the audio_out.audio_data created. ${filename})`)
                        if (this._audio === "play") {
                            player.play(filename, (err: any) => {
                                if (err) {
                                    console.log(err)
                                }
                            })
                        }
                    }
                }
            }
        })
    }

    async _send(phrase: string): Promise<ConversationResponse> {
        return new Promise<ConversationResponse>(async (resolve, reject) => {
            const spinner = ora({
                color: "white",
            }).start()
            try {
                const response = await this._conversation.say(phrase)
                resolve(response)
            } catch(e) {
                reject(e)
            } finally {
                spinner.stop()
            }
        })
    }

}