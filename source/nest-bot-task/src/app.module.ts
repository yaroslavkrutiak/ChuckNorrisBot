import {HttpModule, Module} from '@nestjs/common';
import {MongooseModule} from "@nestjs/mongoose";
import {AppController} from './app.controller';
import {AppService} from './app.service';
import {History, HistorySchema} from "./schemas/history.schema";

@Module({
    imports: [MongooseModule.forRoot("mongodb+srv://user:userpass@cluster0.mxhim.mongodb.net/chuck_norris_history?retryWrites=true&w=majority"),
        MongooseModule.forFeature([
            {name: History.name, schema: HistorySchema}
        ]),HttpModule],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {

}