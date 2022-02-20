import app from "./app";
import { HOST, PORT } from "./config";
import { loggerUtil } from "./utils/index";

app.set("port", PORT)
app.set("host", HOST)

app.listen(app.get("port"), app.get("host"), () => {
    loggerUtil.info(`APP is running, http://${HOST}:${PORT}`)
})