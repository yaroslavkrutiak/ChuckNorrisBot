import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {Document} from 'mongoose'

export type HistoryDocument = History & Document

@Schema()
export class History {
    @Prop()
    chat_id: number
    @Prop()
    value: string
    @Prop()
    updatedAt: string

}

export const HistorySchema = SchemaFactory.createForClass(History)