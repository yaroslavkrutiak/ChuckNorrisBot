import {Injectable} from '@nestjs/common';
import {InjectModel} from "@nestjs/mongoose";
import {History, HistoryDocument} from "./schemas/history.schema";
import {Model} from 'mongoose'
import fetch from 'node-fetch'
import * as dotenv from 'dotenv';

dotenv.config()


@Injectable()
export class AppService {

    constructor(@InjectModel(History.name) private historyModel: Model<HistoryDocument>) {
        const TelegramBot = require('node-telegram-bot-api')
        const token: string = process.env.TOKEN;
        const bot = new TelegramBot(token, {polling: {autoStart: true}});
        setTimeout(() => console.log(`Connect bot via ${process.env.BOT_LINK}`), 2000)

        bot.on('callback_query', query => {
            switch (query.data) {
                case 'Random':
                    this.randomChosen(bot, query, historyModel)
                    break
                case 'Categories':
                    this.categoriesChosen(bot, query)
                    break
                case 'History':
                    this.historyChosen(bot, query, historyModel)
                    break
                case 'Back':
                    this.mainMenuChosen(bot, query)
                    break
                default:
                    this.categoryJokeChosen(bot, query, historyModel, query.data)
            }
        })

        bot.onText(/\/start/gm, msg => {
            bot.sendMessage(msg.chat.id, this.getMainMenuText(), {
                reply_markup: {
                    inline_keyboard: this.getMainMenuInlineKeyboard()
                }
            })
        })

        bot.on('message', msg => {
            bot.deleteMessage(msg.chat.id, msg.message_id)
        })
    }

    randomChosen(bot, query, historyModel): void {
        this.getJoke('https://api.chucknorris.io/jokes/random', bot, query, historyModel)
    }

    categoriesChosen(bot, query): void {
        fetch('https://api.chucknorris.io/jokes/categories')
            .then(res => res.json())
            .then(json => {
                bot.editMessageText('Please choose the category you like', {
                    chat_id: query.from.id,
                    message_id: query.message.message_id,
                    reply_markup: {
                        inline_keyboard: this.generateInlineCategories(json)
                    }
                })
            })
    }

    historyChosen(bot, query, historyModel): void {
        this.getLastCollectionObjects(query, historyModel, 10).then(arr => {
            bot.editMessageText(`Here is last 10 Chuck Norris jokes:\n${this.generateMappedMessage(...arr)}`, {
                chat_id: query.message.chat.id,
                message_id: query.message.message_id,
                reply_markup: {
                    inline_keyboard: this.getJokeInlineKeyboard()
                }
            })
        }).catch(e => console.error(`ERROR: got error sending history message: ${e}`))
    }

    categoryJokeChosen(bot, query, historyModel, category): void {
        this.getJoke(`https://api.chucknorris.io/jokes/random?category=${category}`, bot, query, historyModel)
    }

    mainMenuChosen(bot, query): void {
        bot.editMessageText(this.getMainMenuText(), {
            chat_id: query.message.chat.id,
            message_id: query.message.message_id,
            reply_markup: {
                inline_keyboard: this.getMainMenuInlineKeyboard()
            }
        })
    }

    getJoke(url, bot, query, historyModel): void {
        try {
            fetch(url)
                .then(res => res.json())
                .then(json => {
                    bot.editMessageText(json.value, {
                        chat_id: query.message.chat.id,
                        message_id: query.message.message_id,
                        reply_markup: {
                            inline_keyboard: this.getJokeInlineKeyboard()
                        }
                    })
                    this.pushCollection(bot, query, historyModel, json)
                })
        } catch (e) {
            console.error(`ERROR: error fetching data: ${e}`)
        }
    }

    pushCollection(bot, query, historyModel, json): void {
        historyModel.create({chat_id: query.message.chat.id, value: json.value, updatedAt: Date.now()})
            .catch(e => console.error(`DATABASE WRITE ERROR: ${e}`))
    }

    async getLastCollectionObjects(query, historyModel, amount: number): Promise<Array<object>> {
        return await historyModel.find({chat_id: query.message.chat.id}).sort([['updatedAt', 'descending']]).limit(amount).exec().catch(e => console.error(`ERROR: database error getting last ${amount} elements from collection: ${e}`))
    }

    getMainMenuText(): string {
        return 'Hello I\'m ChuckNorrisBot. I manage to spread jokes about Chuck.\n\nPress a button and have fun:\nRandom - for a random joke\nCategoties - to choose thematic of a joke\nHistory - for your recent jokes'
    }

    generateInlineCategories(array: Array<string>): Array<object> {
        let result: Array<Array<object>> = []
        for (let i = 0; i < array.length; i += 2) {
            result.push([{text: array[i], callback_data: array[i]}, {text: array[i + 1], callback_data: array[i + 1]}])
        }
        result.push(this.getJokeInlineKeyboard()[0])
        return result
    }

    generateMappedMessage(...args): string {
        return args.reduce((acc, curr) => {
            return acc + `\n${curr.value}\n`
        }, '\n')
    }

    getMainMenuInlineKeyboard(): Array<object> {
        return [
            [
                {text: 'Random', callback_data: 'Random'}
            ],
            [
                {text: 'Categories', callback_data: 'Categories'}
            ],
            [
                {text: 'History', callback_data: 'History'}
            ]
        ]
    }

    getJokeInlineKeyboard(): Array<Array<object>> {
        return [
            [
                {text: '◂ Back', callback_data: 'Back'}
            ]
        ]
    }
}