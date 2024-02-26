from flask import Blueprint, jsonify, request
import pymysql
import logging
from decimal import Decimal
import time

# Blueprint for API
api1_blueprint = Blueprint("api1", __name__)


# Function to read database configuration from file
def read_config_from_file(file_path):
    config = {}
    with open(file_path, "r") as file:
        for line in file:
            key, value = line.strip().split("=")
            # Exclude certain keys
            if key not in ["connect_timeout", "raise_on_warnings"]:
                config[key] = value
    return config


# Function to convert value string to basic value
def convert_to_basic_value(value_str):
    multipliers = {
        "K": 1000,
        "M": 1000000,
        "B": 1000000000,
        "T": 1000000000000,
        "P": 1000000000000000,
    }
    for suffix, multiplier in multipliers.items():
        if suffix in value_str:
            return round(float(value_str.replace(suffix, "")) * multiplier, 2)
    return round(float(value_str), 2)


# Function to format numeric value
def format_numeric_value(value):
    multipliers = {
        "K": 1000,
        "M": 1000000,
        "B": 1000000000,
        "T": 1000000000000,
        "P": 1000000000000000,
    }
    for suffix, multiplier in multipliers.items():
        if abs(value) < multiplier:
            return f"{value:.2f}"
        if abs(value) < multiplier * 1000:
            return f"{value / multiplier:.2f}{suffix}"
    return f"{value:.2f}"


def format_data_row(row):
    formatted_row = list(row)
    formatted_row[0] = row[0].strftime("%Y-%m-%d %H:%M:%S")  # 格式化日期時間
    return formatted_row


# Route to get coin names for liquidation
@api1_blueprint.route("/api/liquidation_coin_names", methods=["GET"])
def get_coin_names():
    connection = pymysql.connect(**db_config)
    connection.ping(reconnect=True)
    cursor = connection.cursor()
    cursor.execute("SELECT DISTINCT Coinname FROM liquidation_table")
    coin_names = [row[0] for row in cursor.fetchall()]
    cursor.close()
    coin_names.remove("All") if "All" in coin_names else None
    coin_names.insert(0, "All")
    return jsonify(coin_names)


# Route to get time ranges for liquidation
@api1_blueprint.route("/api/liquidation_time_ranges", methods=["GET"])
def get_time_ranges():
    return jsonify(["1 hr", "4 hr", "12 hr", "24 hr"])


# Function to format data row for real-time updates
def realtime_format_data_row(row):
    formatted_row = list(row)
    formatted_row[-1] = row[-1].strftime("%Y-%m-%d %H:%M:%S")  # Format datetime
    formatted_row[-2] = format_numeric_value(row[-2])
    return formatted_row


# Route to update liquidation data
@api1_blueprint.route("/api/liquidation_update_data", methods=["GET"])
def update_data():
    connection = pymysql.connect(**db_config)
    connection.ping(reconnect=True)
    coinname = request.args.get("coinname")
    time_range = request.args.get("time_range").split(" ")[0]
    coinname = coinname or "All"
    time_range = time_range or "1"
    query = f"SELECT * FROM liquidation_table WHERE Coinname = '{coinname}' AND Time_range = '{time_range}' ORDER BY `time` DESC LIMIT 9"
    with connection.cursor() as cursor:
        cursor.execute(query)
        data = cursor.fetchall()
    formatted_data = [format_data_row(row) for row in data]
    formatted_data = sorted(formatted_data, key=lambda x: float(x[4]), reverse=False)
    for row in formatted_data:
        for i in range(4, 7):
            row[i] = format_numeric_value(float(row[i]))
    return jsonify(formatted_data)


# Route to get exchanges names for real-time liquidation
@api1_blueprint.route("/api/liquidation_real_time_Exchanges", methods=["GET"])
def get_realtime_Exchanges_names():
    connection = pymysql.connect(**db_config)
    connection.ping(reconnect=True)
    with connection.cursor() as cursor:
        cursor.execute("SELECT DISTINCT Exchanges FROM realtime_liquidation_table")
        Exchanges_names = [row[0] for row in cursor.fetchall()]
    Exchanges_names.insert(0, "All")
    return jsonify(Exchanges_names)


# Route to get coin names for real-time liquidation
@api1_blueprint.route("/api/liquidation_real_time_coinname", methods=["GET"])
def get_realtime_coin_names():
    connection = pymysql.connect(**db_config)
    connection.ping(reconnect=True)
    cursor = connection.cursor()
    cursor.execute("SELECT DISTINCT Coinname FROM realtime_liquidation_table")
    coinnames = [row[0] for row in cursor.fetchall()]
    cursor.close()
    sliced_coinnames = [
        (
            coinname.split("-")[0]
            if "-" in coinname
            else coinname.split("_")[0].replace("USDT", "")
        )
        for coinname in coinnames
    ]
    unique_coinnames = sorted(set(sliced_coinnames))
    unique_coinnames.insert(0, "All")
    return jsonify(unique_coinnames)


# Route to get value options for real-time liquidation
@api1_blueprint.route("/api/liquidation_real_time_value", methods=["GET"])
def get_realtime_value():
    unique_coinnames = ["10K", "100K", "1M"]
    unique_coinnames.insert(0, "All")
    return jsonify(unique_coinnames)


# Route to update real-time liquidation data
@api1_blueprint.route("/api/liquidation_update_real_time_data", methods=["GET"])
def update_real_time_data():
    connection = pymysql.connect(**db_config)
    connection.ping(reconnect=True)
    coinname = request.args.get("coinname")
    exchanges_name = request.args.get("exchanges")
    value = request.args.get("value")
    coinname = coinname or "All"
    exchanges_name = exchanges_name or "All"
    value = 0 if value == "All" else convert_to_basic_value(value)
    try:
        if coinname == "All" and exchanges_name == "All":
            query = f"SELECT * FROM realtime_liquidation_table WHERE value > {value} ORDER BY `time` DESC LIMIT 20"
        elif coinname == "All" and exchanges_name != "All":
            query = f"SELECT * FROM realtime_liquidation_table WHERE Exchanges = '{exchanges_name}' AND value > {value} ORDER BY `time` DESC LIMIT 20"
        elif coinname != "All" and exchanges_name == "All":
            query = f"SELECT * FROM realtime_liquidation_table WHERE Coinname LIKE '{coinname}%' AND value > {value} ORDER BY `time` DESC LIMIT 20"
        else:
            query = f"SELECT * FROM realtime_liquidation_table WHERE Coinname LIKE '{coinname}%' AND Exchanges = '{exchanges_name}' AND value > {value} ORDER BY `time` DESC LIMIT 20"
        with connection.cursor() as cursor:
            cursor.execute(query)
            data = cursor.fetchall()
        formatted_data = [realtime_format_data_row(row) for row in data]
        formatted_data = formatted_data[::-1]
        return jsonify(formatted_data)
    except Exception as e:
        logging.error(f"Error in update_real_time_data: {str(e)}")


# Route to update hour table data
@api1_blueprint.route("/api/liquidation_update_hourdata", methods=["GET"])
def update_hourtable():
    connection = pymysql.connect(**db_config)
    connection.ping(reconnect=True)
    query = """
    SELECT MAX(time) AS Time_range, Time_range, liquidations, long_, short FROM liquidation_table WHERE coinname = 'All' AND time_range IN (1, 4, 12, 24) GROUP BY time_range;
    """
    with connection.cursor() as cursor:
        cursor.execute(query)
        data = cursor.fetchall()
    sorted_data = sorted(data, key=lambda x: int(x[1]))
    formatted_data = [
        tuple(
            format_numeric_value(value) if isinstance(value, Decimal) else value
            for value in row
        )
        for row in sorted_data
    ]
    return jsonify(formatted_data)


# Route to update total table data
@api1_blueprint.route("/api/liquidation_totaltable_update_data", methods=["GET"])
def update_totaltable():
    merged_data = []
    connection = pymysql.connect(**db_config)
    connection.ping(reconnect=True)
    home_start_time = time.time()
    query = """
    SELECT rank, coin, price, `pricechange(24h%)` FROM home_table WHERE (rank, time) IN (SELECT rank, MAX(time) AS max_time FROM home_table GROUP BY rank) ORDER BY rank;
    """
    with connection.cursor() as cursor:
        cursor.execute(query)
        data = cursor.fetchall()
    sorted_data = sorted(data, key=lambda x: int(x[0]))
    home_end_time = time.time()
    home_query_time = home_end_time - home_start_time
    print("home:", home_query_time)
    connection = pymysql.connect(**db_config)
    connection.ping(reconnect=True)
    liquidation_start_time = time.time()
    for rowdata in range(len(sorted_data)):
        query = f"""
            SELECT MAX(time) AS time ,time_range, long_, short FROM liquidation_table WHERE coinname = '{sorted_data[rowdata][1]}' AND exchanges = 'All' AND time_range IN (1, 4, 24) GROUP BY time_range;
            """
        with connection.cursor() as cursor:
            cursor.execute(query)
            data = cursor.fetchall()
        try:
            merged_data.append(
                sorted_data[rowdata] + data[0][2:] + data[2][2:] + data[1][2:]
            )
        except:
            merged_data.append(sorted_data[rowdata])
    liquidation_end_time = time.time()
    liquidation_query_time = liquidation_end_time - liquidation_start_time
    print("liquidation:", liquidation_query_time)
    formatted_start_time = time.time()
    formatted_data = [
        tuple(
            format_numeric_value(value) if isinstance(value, Decimal) else value
            for value in row
        )
        for row in merged_data
    ]
    formatted_end_time = time.time()
    formatted_query_time = formatted_end_time - formatted_start_time
    print("formatted:", formatted_query_time)
    return jsonify(formatted_data)


# Route to update largest table data
@api1_blueprint.route("/api/liquidation_update_largest", methods=["GET"])
def update_largesttable():
    connection = pymysql.connect(**db_config)
    connection.ping(reconnect=True)
    query = """
    SELECT * FROM largest_liquidations_info ORDER BY time DESC LIMIT 1;
    """
    with connection.cursor() as cursor:
        cursor.execute(query)
        data = cursor.fetchall()
    formatted_data = [
        tuple(
            format_numeric_value(value) if isinstance(value, Decimal) else value
            for value in row
        )
        for row in data
    ]
    return jsonify(formatted_data)


# Read database configuration from file
config_file_path = "./db_config/liquidation_db_config.txt"
additional_config = read_config_from_file(config_file_path)
logging.basicConfig(filename="./web_liquidation_log.txt", level=logging.ERROR)
db_config = {
    **additional_config,
    "port": 3306,
    "connect_timeout": 30,
}
