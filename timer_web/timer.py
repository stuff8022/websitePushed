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
def renderPage(): #provides the react page
    return mainPage()

@app.route("/serverTime")
def currentTime(): #gets the current time of the server 
    currentDatetime = math.ceil(time.time() * 1000)
    return {"datetime": currentDatetime}

@app.route("/timer/<int:ID>")
def endTimeTimer(ID): #gets the endtime of a specific timer
    timer = timerStorage.timer(ID)
    return {"endTime": timer.endTime}

@app.route("/timer/<int:ID>/cred", methods=["GET", "POST"])
def cred(ID): #allows the client to take control of a timer with the right password
    if request.method == "POST":
        password = request.form["password"]
        timer = timerStorage.timer(ID)
        if timer.controlTimer(password) == True:
            session["timer"] = ID
            resp = make_response(str(timer.ID))
            resp.set_cookie('ID',str(timer.ID))
        else:
            resp = make_response("Invalid")

        return resp

@app.route("/timer/<int:ID>/start", methods=["GET", "POST"])
def start(ID): #handles the start and editing of a timer
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
        timer = timerStorage.newTimer(request.form["password"])
        session["timer"] = timer.ID
        resp = make_response(str(timer.ID))
        resp.set_cookie('ID',str(timer.ID))
        return resp
        

if __name__ == "__main__":
    app.run(host='0.0.0.0',port=5000)