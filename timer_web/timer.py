from cmath import nan
import datetime
from flask import Flask
from markupsafe import escape
from flask import request
from flask import make_response
from flask import render_template, send_from_directory
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
        file = open(timerStorage.databaseLoc(),"r")
        file.close()
    except FileNotFoundError:
        file = open(timerStorage.databaseLoc(),"w") #create the file
        file.close()
        connection = sqlite3.connect(timerStorage.databaseLoc()) #connects to the new database
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
def renderPage(): #provnamees the react page
    return mainPage()

@app.route("/manifest.json")
def manifest():
    return send_from_directory('./static',"manifest.json")

@app.route("/bencancode")
def bencancode():
    return render_template("/bencancode/public/index.html")

@app.route("/bencancodeIntroduction")
def bencancodeIntro():
    return render_template("bencancodeIntro.html")

@app.route("/serverTime")
def currentTime(): #gets the current time of the server
    currentDatetime = math.ceil(time.time() * 1000)
    return {"datetime": currentDatetime}

@app.route("/timer/<string:name>/exist")
def timerExist(name): #gives true or false for if the specified timer exists
    timer = timerStorage.timer(name)
    return {"timerExist": timer.exist}

@app.route("/timer/<string:name>")
def endTimeTimer(name): #gets the endtime of a specific timer
    timer = timerStorage.timer(name)
    if timer.exist: #if the timer exists
        return {"endTime": timer.endTime}
    else: #nan returned when timer does not exist
        return {"endTime": nan}

@app.route("/timer/<string:name>/cred", methods=["GET", "POST"])
def cred(name): #allows the client to take control of a timer with the right password
    if request.method == "POST":
        password = request.form["password"]
        timer = timerStorage.timer(name)
        if timer.exist: #checks if timer exists
            if timer.controlTimer(password) == True:
                session["timer"] = name
                resp = make_response(str(timer.name))
                resp.set_cookie('name',str(timer.name))
            else:
                resp = make_response("Wrong Password")
        else:
            resp = make_response("Timer Doesn't exist")
        return resp

@app.route("/timer/<string:name>/start", methods=["GET", "POST"])
def start(name): #handles the start and editing of a timer
    if session.get("timer"):
        endTime = 0
        #offset = request.form["timeOffSet"]
        seconds = request.form["seconds"]
        minutes = request.form["minutes"]
        hours = request.form["hours"]
        days = request.form["days"]
        weeks = request.form["weeks"]
        timer = timerStorage.timer(session["timer"])
        if bool(seconds):
            endTime = endTime + float(seconds)
        if bool(minutes):
            endTime = endTime + (float(minutes) * 60)
        if bool(hours):
            endTime = endTime + (float(hours) * 60 * 60)
        if bool(days):
            endTime = endTime + (float(days) * 60 * 60 * 24)
        if bool(weeks):
            endTime = endTime + (float(weeks) * 60 * 60 * 24 * 7)

        #timer.startTimer(endTime + time.time() - float(offset))
        timer.startTimer(endTime + time.time())
        return "done"


@app.route("/newTimer", methods=["GET", "POST"]) #handles the creation of a new timer
def newTimer():
    if request.method == "POST":
        timerName = str(request.form["timerName"])
        password = str(request.form["password"])
        if not(timerExist(timerName)["timerExist"]): #checks if timer name already exists or not
            timer = timerStorage.newTimer(timerName, password)
            session["timer"] = timerName
            resp = make_response("Done")
            resp.set_cookie('name',str(timer.name))
        else:
            resp = make_response("Name Exists")
        return resp


if __name__ == "__main__":
    app.run(host='0.0.0.0',port=5000)