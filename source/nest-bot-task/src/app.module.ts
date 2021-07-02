import {HttpModule, Module} from '@nestjs/common';
import {MongooseModule} from "@nestjs/mongoose";
import {AppController} from './app.controller';
import {AppService} from './app.service';
import {History, HistorySchema} from "./schemas/history.schema";

@Module({
    imports: [MongooseModule.forRoot(process.env.DB_CONNECTION_LINK),
        MongooseModule.forFeature([
            {name: History.name, schema: HistorySchema}
        ]),HttpModule],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {

}