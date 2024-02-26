from flask import Flask, render_template
from liquidation_api import api1_blueprint
from logshort_api import api2_blueprint
import logging

app = Flask(__name__)

logging.basicConfig(filename="./web_log.txt", level=logging.INFO)

# 注冊藍圖
app.register_blueprint(api1_blueprint)
app.register_blueprint(api2_blueprint)


# 主頁
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/longshort")
def longshort():
    return render_template("longshort.html")


if __name__ == "__main__":
    # app.run(host="0.0.0.0", port=5000, debug=False)
    app.run(debug=True)
