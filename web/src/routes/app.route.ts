import express from 'express';


export class AppRoute {
    protected route: express.Router

    constructor() {
        this.route = express.Router()
    }

    public Routes = (): express.Router => {
        this.route.get("/", (req: express.Request, res: express.Response) => {
            res.render("site/main", {layout: "main"})
        })

        this.route.get("/test", (req: express.Request, res: express.Response, next: express.NextFunction) => {
            res.status(200).json({
              status: "success",
               message: "App is working",
            });
        });

        return this.route
    }
}