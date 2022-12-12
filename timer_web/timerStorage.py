from multiprocessing import connection
import sqlite3
import math
import hashlib
import usefulFunctions
import time

def hashPassword(name, password): #this hashes the password, learnt in https://docs.python.org/3/library/hashlib.html
    return str(hashlib.sha512(b"c6-wY9$Ka3zh[c$#m[CHaTAF_f&WZ&GCwM$Yq6Jg" + str(name).encode() + str(password).encode()).hexdigest())

def databaseLoc():
    return "timerDB.db"

class timer:
    def __init__(self, name):
        self.name = name
        self.exist = False
        self.endTime = None
        self.password = None

        #password = hashPassword(self.name, password) #duplicate of controlRoom function that checks if credentials are correct
        connection = sqlite3.connect(databaseLoc())
        cursor = connection.execute("SELECT * FROM timers WHERE name=:name", {"name": name})
        for row in cursor:
            self.exist = True
            self.endTime = int(row[2]) #has to be int since sqllite does not support decimals (will lose fraction of millisecond so doesn't matter)
            self.password = row[1]
        connection.close()
    def controlTimer(self, password):
        return self.password == hashPassword(self.name, password)


    def removeTimer(self): #removes the timer
        self.removeTimer(self.name)
        connection = sqlite3.connect(databaseLoc())
        connection.execute("DELETE FROM timers WHERE name=:name", {"name":self.name})
        connection.commit()
        connection.close()
        self.timer = None
        self.name = None
        self.exist = False

    def startTimer(self, unixTime): #starts or edits the timer
        connection = sqlite3.connect(databaseLoc())
        connection.execute("UPDATE timers SET endTime=:dateTime WHERE name=:name", {"name": self.name, "dateTime": math.ceil(unixTime * 1000)})
        connection.commit()
        connection.close()
        self.endTime = int(unixTime * 1000)


def newTimer(name, password): #creates the timer
    connection = sqlite3.connect(databaseLoc())
    connection.execute("INSERT INTO timers (name, password, endTime) VALUES (:name, :password, :endTime)", {"name": name, "password": hashPassword(name, password), "endTime": math.ceil(time.time() * 1000)}) #datetime is stored as unix time to prevent timezone issues
    connection.commit()
    connection.close()
    return timer(name)

if __name__ == "__main__":
    obj = newTimer("test", "test")
    print(obj.controlTimer("test"))