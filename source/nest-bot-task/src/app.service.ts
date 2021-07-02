import {Injectable} from '@nestjs/common';
import {InjectModel} from "@nestjs/mongoose";
import {History, HistoryDocument} from "./schemas/history.schema";
import {Model} from 'mongoose'
import fetch from 'node-fetch'

const choose = 'Hello I\'m ChuckNorrisBot. I manage to spread jokes about Chuck.\n\nPress a button and have fun:\nRandom - for a random joke\nCategoties - to choose thematic of a joke\nHistory - for your recent jokes'


@Injectable()
export class AppService {


    constructor(@InjectModel(History.name) private historyModel: Model<HistoryDocument>) {
        process.env.NTBA_FIX_319 = '1'
        const TelegramBot = require('node-telegram-bot-api')
        const token = '';
        const bot = new TelegramBot(token, {polling: {interval: 300, autoStart: true, params: {timeout: 10}}});
        // setTimeout(() => console.log(`Connect bot via https://t.me/node_task_bot`), 3000)

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
                    this.categoryJoke(bot, query, historyModel, query.data)
            }
        })


    }

    categoryJoke(bot, query, historyModel, category) {
        fetch(`https://api.chucknorris.io/jokes/random?category=${category}`)
            .then(res => res.json())
            .then(json => {
                bot.editMessageText(json.value, {
                    chat_id: query.message.chat.id,
                    message_id: query.message.message_id,
                    parse_mode: 'markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {text: '◂ Back', callback_data: 'Back'}
                            ]
                        ]
                    }
                })
                historyModel.create({chat_id: query.message.chat.id, value: json.value, updatedAt: Date.now()})
                    .then(console.log)
                    .catch(e => console.log(`DATABASE WRITE ERROR: ${e}`))
            })
    }

    randomChosen(bot, query, historyModel) {
        console.log('randomChosen entered')
        fetch('https://api.chucknorris.io/jokes/random')
            .then(res => res.json())
            .then(json => {
                bot.editMessageText(json.value, {
                    chat_id: query.message.chat.id,
                    message_id: query.message.message_id,
                    parse_mode: 'markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {text: '◂ Back', callback_data: 'Back'}
                            ]
                        ]
                    }
                })
                historyModel.create({chat_id: query.message.chat.id, value: json.value, updatedAt: Date.now()})
                    .then(console.log)
                    .catch(e => console.log(`DATABASE WRITE ERROR: ${e}`))
            })
    }

    mainMenuChosen(bot, query) {
        bot.editMessageText(choose, {
            chat_id: query.message.chat.id,
            message_id: query.message.message_id,
            parse_mode: 'markdown',
            reply_markup: {
                inline_keyboard: [
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
        })
    }

    historyChosen(bot, query, historyModel) {
        historyModel.find({chat_id: query.message.chat.id}).sort([['updatedAt', 'descending']]).limit(10).exec().then(arr => {
            bot.editMessageText(`Here is last 10 Chuck Norris jokes:\n${this.generateMappedMessage(...arr)}`, {
                chat_id: query.message.chat.id,
                message_id: query.message.message_id,
                reply_markup: {
                    inline_keyboard: [
                        [
                            {text: '◂ Back', callback_data: 'Back'}
                        ]
                    ]
                }
            })
        })
    }


    generateMappedMessage(...args) {
        return args.reduceRight((acc, curr) => {
            return acc + `\n${curr.value}\n`
        }, '\n')
    }

    generateInlineCategories(array) {
        const result = []
        for (let i = 0; i < array.length; i += 2) {
            result.push([{text: array[i], callback_data: array[i]}, {text: array[i + 1], callback_data: array[i + 1]}])
        }
        return result
    }

    categoriesChosen(bot, query) {
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

}