from flask import Blueprint, jsonify, request
import pymysql
import logging
from decimal import Decimal
import time

# Create a Blueprint for API
api2_blueprint = Blueprint("api2", __name__)


# Function to read database configuration from file
def read_config_from_file(file_path):
    config = {}
    with open(file_path, "r") as file:
        for line in file:
            key, value = line.strip().split("=")
            if key != "connect_timeout" and key != "raise_on_warnings":
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
    # If no matching suffix, default to 1 (no change)
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


# Route to get coin names for longshort
@api2_blueprint.route("/api/longshort_coin_names", methods=["GET"])
def get_coin_names():
    connection = pymysql.connect(**db_config)
    connection.ping(reconnect=True)
    cursor = connection.cursor()
    cursor.execute("SELECT DISTINCT Coinname FROM longvsshort_table")
    coin_names = [row[0] for row in cursor.fetchall()]
    cursor.close()
    return jsonify(coin_names)


# Route to get time ranges for longshort
@api2_blueprint.route("/api/longshort_time_ranges", methods=["GET"])
def get_time_ranges():
    time_ranges = [
        "5 minute",
        "15 minute",
        "30 minute",
        "1 hour",
        "4 hour",
        "12 hour",
        "24 hour",
    ]
    return jsonify(time_ranges)


# Function to format data row for real-time updates
def realtime_format_data_row(row):
    formatted_row = list(row)
    formatted_row[-1] = row[-1].strftime("%Y-%m-%d %H:%M:%S")  # Format datetime
    formatted_row[4] = format_numeric_value(row[4])  # Format numeric values
    formatted_row[3:5] = map(str, formatted_row[3:5])  # Convert Decimal to string
    return formatted_row


# Function to format data row for historical updates
def format_data_row(row):
    formatted_row = list(row)
    formatted_row[0] = row[0].strftime("%Y-%m-%d %H:%M:%S")  # Format datetime
    formatted_row[4:8] = map(str, formatted_row[4:8])  # Convert Decimal to string
    return formatted_row


# Route to update historical longshort data
@api2_blueprint.route("/api/longshort_update_data", methods=["GET"])
def update_data():
    connection = pymysql.connect(**db_config)
    connection.ping(reconnect=True)
    coinname = request.args.get("coinname") or "BTC"
    time_range = request.args.get("time_range") or "5 minute"
    query = f"SELECT * FROM longvsshort_table WHERE Coinname = '{coinname}' AND Time_range = '{time_range}' AND time >= (SELECT MAX(time) FROM longvsshort_table WHERE Coinname = '{coinname}' AND Time_range = '{time_range}') ORDER BY time DESC;"
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
    return jsonify(formatted_data[::-1])


# Route to update real-time longshort data
@api2_blueprint.route("/api/longshort_update_real_time_data", methods=["GET"])
def update_real_time_data():
    connection = pymysql.connect(**db_config)
    connection.ping(reconnect=True)
    coinname = request.args.get("coinname") or "All"
    exchanges_name = request.args.get("exchanges") or "All"
    try:
        if coinname == "All" and exchanges_name == "All":
            query = (
                "SELECT * FROM realtime_longshort_table ORDER BY `time` DESC LIMIT 20"
            )
        elif coinname == "All" and exchanges_name != "All":
            query = f"SELECT * FROM realtime_longshort_table WHERE Exchanges = '{exchanges_name}' ORDER BY `time` DESC LIMIT 20"
        elif coinname != "All" and exchanges_name == "All":
            query = f"SELECT * FROM realtime_longshort_table WHERE Coinname LIKE '{coinname}%' ORDER BY `time` DESC LIMIT 20"
        else:
            query = f"SELECT * FROM realtime_longshort_table WHERE Coinname LIKE '{coinname}%' AND Exchanges = '{exchanges_name}' ORDER BY `time` DESC LIMIT 20"
        with connection.cursor() as cursor:
            cursor.execute(query)
            data = cursor.fetchall()
        formatted_data = [realtime_format_data_row(row) for row in data]
        return jsonify(formatted_data[::-1])
    except Exception as e:
        logging.error(f"Error in update_real_time_data: {str(e)}")


# Route to update total longshort table data
@api2_blueprint.route("/api/longshort_totaltable_update_data", methods=["GET"])
def update_totaltable():
    merged_data = []
    connection = pymysql.connect(**db_config)
    connection.ping(reconnect=True)
    query = """
    SELECT rank, coin, price, `pricechange(24h%)` FROM home_table WHERE (rank, time) IN (SELECT rank, MAX(time) AS max_time FROM home_table GROUP BY rank) ORDER BY rank;
    """
    with connection.cursor() as cursor:
        cursor.execute(query)
        data = cursor.fetchall()
    sorted_data = sorted(data, key=lambda x: int(x[0]))
    connection = pymysql.connect(**db_config)
    connection.ping(reconnect=True)
    for rowdata in range(len(sorted_data)):
        query = f"""
            SELECT MAX(time) AS time ,time_range, long_value, short_value FROM longvsshort_table WHERE coinname = '{sorted_data[rowdata][1]}' AND exchanges = 'All' AND time_range IN ('5 minute', '15 minute', '30 minute') GROUP BY time_range;
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
    formatted_data = [
        tuple(
            format_numeric_value(value) if isinstance(value, Decimal) else value
            for value in row
        )
        for row in merged_data
    ]
    return jsonify(formatted_data)


# Route to update top block data for longshort
@api2_blueprint.route("/api/longshort_update_topblock_data", methods=["GET"])
def update_topblock_data():
    connection = pymysql.connect(**db_config)
    connection.ping(reconnect=True)
    time_range = request.args.get("time_range") or "1"
    try:
        query = f"SELECT MAX(time) AS max_time, time_range, `long_volume%`, long_volume, `longshort%`, longshort, `top_trade_longshort%`, top_trade_longshort, `top_trade_longshort_positions%`, top_trade_longshort_positions, long_position FROM longshort_summary_leftblock WHERE time_range={time_range} GROUP BY time_range;"
        query2 = f"SELECT MAX(time) AS max_time, time_range, `long_volume%`, long_volume, `longshort%`, longshort, `top_trade_longshort%`, top_trade_longshort, `top_trade_longshort_positions%`, top_trade_longshort_positions, long_position FROM longshort_summary_rightblock WHERE time_range={time_range} GROUP BY time_range;"
        with connection.cursor() as cursor:
            cursor.execute(query)
            data = cursor.fetchall()
        with connection.cursor() as cursor:
            cursor.execute(query2)
            data2 = cursor.fetchall()
        formatted_data = [
            tuple(
                format_numeric_value(value) if isinstance(value, Decimal) else value
                for value in row
            )
            for row in data
        ]
        formatted_data2 = [
            tuple(
                format_numeric_value(value) if isinstance(value, Decimal) else value
                for value in row
            )
            for row in data2
        ]
        result = {"left": formatted_data, "right": formatted_data2}
        return jsonify(result)
    except Exception as e:
        logging.error(f"Error in longshort_update_topblock_data: {str(e)}")


# Read database configuration from file
config_file_path = "./db_config/lonshort_db_config.txt"
additional_config = read_config_from_file(config_file_path)
logging.basicConfig(filename="./web_longshort_log.txt", level=logging.ERROR)
db_config = {
    **additional_config,
    "port": 3306,
    "connect_timeout": 30,
}
