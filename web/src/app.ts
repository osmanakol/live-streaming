import express, { Application } from "express";
import { randomBytes } from "crypto";
import { engine } from "express-handlebars";
import { error_handler_middleware } from "./middleware/error_handler.middleware";
import { AppRoute } from "./routes/app.route";
import { errorHandlerUtil } from "./utils/index";

class App {
    public app: Application

    constructor(){
        this.app = express()
        this.errorHandlerSetup()
        this.config()
        this.handlebarsSettings()
        this.securityOptions()
        this.routeConfig()
    }

    private config = () => {
        this.app.use(express.json())
        this.app.use(express.urlencoded({extended:true}))
    }

    private handlebarsSettings = () => {
        this.app.engine("handlebars", engine())
        this.app.set("view engine", "handlebars")
    }

    private routeConfig = () => {
        this.app.use("/", new AppRoute().Routes())
    }

    private errorHandlerSetup = () => {
        this.app.use(error_handler_middleware())
        process.on("unhandledRejection", (reason: Error, promise: Promise<any>) => {
            throw reason
        })

        process.on("uncaughtException", (err:Error) => {
            errorHandlerUtil.handleError(err)
            if (!errorHandlerUtil.isTrustedError(err))
                process.exit(1)
        })
    }

    private securityOptions = () => {
        this.app.use((req, res, next) => {
            res.locals.cspNonce = randomBytes(16).toString('hex')
            next()
        })

        this.app.use((req, res, next) => {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
            next();
        })
    }
}

export default new App().app