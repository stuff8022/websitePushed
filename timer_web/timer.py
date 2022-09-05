from cmath import nan
import datetime
from flask import Flask
from markupsafe import escape
from flask import request
from flask import make_response
from flask import render_template
from flask import session
import sqlite3
import time

import math
import usefulFunctions
import timerStorage

app = Flask(__name__)
app.secret_key = "zOGSyfuncwgt68bgerUx5ctSTf2UXwxBr" #just some random string to make the session key unpredictable


def databaseCreation():
    try: #if database is not found then it will create a database instead with the right tables
        file = open("roomDB.db","r")
        file.close()
    except FileNotFoundError:
        file = open("roomDB.db","w") #create the file
        file.close()
        connection = sqlite3.connect("roomDB.db") #connects to the new database
        cursor = connection.cursor()
        tableCreate = open("databaseTableCreation.sql","r") #this file stores the sql commands to create the right tables
        tableCreate = tableCreate.readlines()
        string = ""
        for i in range(0,len(tableCreate)):
            string+= tableCreate[i] #makes the array representing each line into only one single string
        tableCreate = string
        cursor.executescript(tableCreate) #executes the sql script that will create the tables
        connection.close()
databaseCreation() #creates database if not created (needs to run on server startup)

def mainPage():
    return render_template("/build/index.html")

@app.route("/")
def renderPage():
    return mainPage()

@app.route("/serverTime")
def currentTime():
    currentDatetime = math.ceil(time.time() * 1000)
    return {"datetime": currentDatetime}

@app.route("/timer/<int:ID>")
def roomTimes(ID):
    timer = timerStorage.timer(ID)
    return {"endTime": timer.endTime}

@app.route("/timer/<int:ID>/cred", methods=["GET", "POST"])
def cred(ID):
    if request.method == "POST":
        password = request.form("password")
        timer = timerStorage.timer(ID)
        if timer.controlTimer(password) == True:
            session["timer"] = ID

@app.route("/timer/<int:ID>/start", methods=["GET", "POST"])
def start(ID):
    if session.get("timer"):
        seconds = request.form("seconds")
        minutes = request.form("minutes")
        hours = request.form("hours")
        days = request.form("days")
        weeks = request.form("weeks")
        timer = timerStorage.timer(session["timer"])
        endTime = seconds + (minutes * 60) + (hours * 60 * 60) + (days * 60 * 60 * 24) + (weeks * 60 * 60 * 24 * 7)
        timer.startTimer(endTime - time.time())


@app.route("/newTimer", methods=["GET", "POST"])
def newTimer():
    if request.method == "POST":
        timer = timerStorage.newTimer(request.form["password"])
        session["timer"] = timer.ID
        resp = make_response(str(timer.ID))
        resp.set_cookie('ID',str(timer.ID))
        #return {"ID": timer.ID, "session": session.values(timer.ID)}
        return resp
        

@app.route("/getCurrentTimerID")
def currentTimerID():
    if session.get("timer"):
        return {"ID": session["timer"]}
    else:
        return {"ID": nan}

if __name__ == "__main__":
    app.run(host='0.0.0.0',port=5000)