from multiprocessing import connection
import sqlite3
import math
import hashlib
import usefulFunctions
import time

def hashPassword(ID, password): #this hashes the password, learnt in https://docs.python.org/3/library/hashlib.html
    return str(hashlib.sha224(b"" + str(ID).encode() + str(password).encode()).hexdigest())

def databaseLoc():
    return "roomDB.db"

class timer:
    def __init__(self, ID):
        self.ID = ID
        self.exist = False
        self.endTime = None
        self.password = None

        #password = hashPassword(self.ID, password) #duplicate of controlRoom function that checks if credentials are correct
        connection = sqlite3.connect(databaseLoc())
        cursor = connection.execute("SELECT * FROM timers WHERE ID=:ID", {"ID": ID})
        for row in cursor:
            self.exist = True
            self.endTime = int(row[2]) #has to be int since sqllite does not support decimals (will lose fraction of millisecond so doesn't matter)
            self.password = row[1]
        connection.close()
    def controlTimer(self, password):
        return self.password == hashPassword(self.ID, password)


    def removeTimer(self):
        self.removeTimer(self.ID)
        connection = sqlite3.connect(databaseLoc())
        connection.execute("DELETE FROM timers WHERE ID=:ID", {"ID":self.ID})
        connection.commit()
        connection.close()
        self.timer = None
        self.ID = None
        self.exist = False

    def startTimer(self, unixTime):
        connection = sqlite3.connect(databaseLoc())
        connection.execute("UPDATE timers SET endTime=:dateTime WHERE ID=:ID", {"ID": self.ID, "dateTime": math.ceil(unixTime * 1000)})
        connection.commit()
        connection.close()
        self.endTime = int(unixTime * 1000)


def newTimer(password):
    connection = sqlite3.connect(databaseLoc())
    connection.execute("INSERT INTO timers (password, endTime) VALUES (:password, :endTime)", {"password": password, "endTime": math.ceil(time.time() * 1000)}) #datetime is stored as unix time to prevent timezone issues
    connection.commit()
    cursor = connection.execute("select last_insert_rowid()")
    for row in cursor:
        ID = row[0]
    password = hashPassword(ID, password)
    connection.execute("UPDATE timers SET password=:password WHERE ID=:ID", {"password": password, "ID": ID})
    connection.commit()
    connection.close()
    return timer(ID)

if __name__ == "__main__":
    obj = newTimer("test")
    print(obj.controlTimer("test"))