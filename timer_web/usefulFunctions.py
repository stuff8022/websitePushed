from datetime import datetime


def stringDate(dateTime): #this simply makes the date time a string so that I can just stick it on a HTML page in a readable state
    date = str(dateTime.year) + "-" + str(dateTime.month) + "-" + str(dateTime.day)
    time = str(dateTime.hour) + ":" + str(dateTime.minute) + ":" + str(dateTime.second) + "." + str(dateTime.microsecond)
    return date + " " + time