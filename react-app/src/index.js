import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import axios from 'axios';
//import App from './App';
import reportWebVitals from './reportWebVitals';
import { useCookies } from 'react-cookie';

const root = ReactDOM.createRoot(document.getElementById('root'));

function mainUrl(){ //just used for development reasons
  //return "http://localhost:5000";
  return "";
}

const getServerComputerDateTime = async (setData) =>{ //returns what the server thinks the time is and the computer thinks the time is
  try{
    const resp = await fetch(mainUrl() +"/serverTime");

    const data = await resp.json();
  
    setData({"datetime": data["datetime"], "computerTime": (new Date().getTime())});
  }catch(err){
    //alert(err);
  }
  
}
const getTimerEndDate = async (setData, timerID) =>{ //gets the time for the end of the countdown
  try{
    const resp = await fetch(mainUrl() +"/timer/" + timerID);

    const data = await resp.json();

    setData(data);
  }catch(err){
    //alert(err);
  }
  
}


function TimeOffset(){ //finds the offset between what the computer thinks the time is as well as the server
  const [data, setData] = useState({"datetime": NaN, "computerTime": NaN}) //uses states to get value out of async function
  useEffect(() =>{
    const refreshTimeOffset = setInterval(() =>{ //Updates to any change to the end time
    getServerComputerDateTime(setData);
  }, 1000)
  return () => clearInterval(refreshTimeOffset);
});
  var timeOffset = data["datetime"] - data["computerTime"];
  return timeOffset;
}

function EndTime(props){ //returns what the end time is
  var Timeoffset = TimeOffset();
  var refresh;
  const [data, setData] = useState({"endTime": NaN}) //uses states to get value out of async function
  if (TimeLeft(data["endTime"] - Timeoffset) > 0){ //this varies the setInteval rate to prevent CPU going 100% once timer goes to 0
    refresh = 100;
  }else{
    refresh = 1000;
  }
  useEffect(() =>{
    const refreshEndTime = setInterval(() =>{ //Updates to any change to the end time
      getTimerEndDate(setData, props.ID);
    }, refresh)
    return () => clearInterval(refreshEndTime);
  });
  return data["endTime"];
}

function OffsetEndTime(props){ //returns what the end time is taking into account any difference in believed time between the server as well as the computer
  var CompDateTime = EndTime(props) - TimeOffset();
  return CompDateTime;
}

function TimeLeft(localEndTime){ //works out how long is left of the time
  var currentTime = (new Date()).getTime();
  var time = localEndTime - currentTime;
  if(time >= 0){ //prevents negative time from occuring
    return time;
  }else if(time < 0){
    return 0;
  }else{ //shows nan when there is no number
    return NaN;
  }
}


function timeLeftBreak(timeM){//this calculates the weeks days hours minutes and seconds it will take for the bid to close
  if(timeM != NaN){
    timeM = parseInt(timeM / 1000); //makes it into seconds only
    var weeks = timeM / (60*60*24*7); //gets the number of weeks
    var leftover = weeks % 1;
    weeks = weeks - leftover;

    var days = leftover * 7; //calculates the number of days left
    leftover = days % 1;
    days = days - leftover;

    var hours = leftover * 24; //calculates the amount of hours left
    leftover = hours % 1;
    hours = hours - leftover;

    var minutes = leftover * 60; //calculates the amount of minutes left
    leftover = minutes % 1;
    minutes = minutes - leftover;

    var seconds = leftover * 60; //calulates the amount of seconds left
    leftover = seconds % 1;
    seconds = Math.round(seconds);
    if(seconds == 60){ //makes it impossible to show 60 seconds
      seconds = 0;
      minutes = minutes + 1;
      if(minutes == 60){
        minutes = 0;
        hours = hours + 1;
        if(hours == 24){
          hours = 0;
          days = days + 1;
          if(days == 7){
            days = 0;
            weeks = weeks = 1;
          }
        }
      }
    }
  }
  else{ //deals with nan
    var seconds = NaN;
    var minutes = NaN;
    var hours = NaN;
    var hours = NaN;
    var days = NaN;
    var weeks = NaN;
  }
  return {"seconds": seconds, "minutes": minutes, "hours": hours, "days": days, "weeks": weeks};
}

function DisplayTimeLeft(time){ //makes the value of how long is left of the timer in a presentable manner that can be displayed to the user
  var timeLeftBreakdown = timeLeftBreak(time);
  var presentString = ""
  presentString = presentString + String(timeLeftBreakdown["seconds"])+ " seconds, "
  presentString = presentString + String(timeLeftBreakdown["minutes"]) + " minutes, "
  presentString = presentString + String(timeLeftBreakdown["hours"]) + " hours, "
  presentString = presentString + String(timeLeftBreakdown["days"]) + " days, "
  presentString = presentString + String(timeLeftBreakdown["weeks"]) + " weeks"
  return presentString;

}

function Timer(props){ //gets the end time then formats it in a nice way
  const localEndTime = OffsetEndTime(props)
  const [remainTime, getRemainTime] = useState(0);
  useEffect(() =>{
    const refreshTimer = setInterval(() =>{
      getRemainTime(TimeLeft(localEndTime)); //set inteval used to ask for the end time repeatably to see if there are any changes
    }, 100)
    return () => clearInterval(refreshTimer);
  });
  return DisplayTimeLeft(remainTime);
}


function TimerPage(props){ //displays the timer as well as anything else relating to the timer
  
  const [cookies, setCookie, removeCookie] = useCookies(["ID"]);
  if(cookies["ID"] == props.ID){ //if the client is in control of the timer (can edit how long the timer times for)
    return <><button onClick={() => props.setLoc({"Loc": "Home"})}>Home</button>
    <br></br>
    <h1>Timer number {props.ID}</h1>
    <br></br>
    <Timer ID={props.ID} setLoc={props.setLoc}/><br></br><br></br>
    <TimerAmount ID={props.ID}/></>;
  }else{ //if the client isn't in control of the timer
    return <><button onClick={() => props.setLoc({"Loc": "Home"})}>Home</button>
    <br></br>
    <h1>Timer number {props.ID}</h1>
    <br></br>
    <Timer ID={props.ID} setLoc={props.setLoc}/><br></br>
    <TimerLogin ID={props.ID} setLoc={props.setLoc} error={props.error} setCookie={setCookie}/></>
  }
}

function TimerAmount(props){ //used to set how long the timer times for
  const onSubmit = (e) => { //behaviour of sending the form to the server
    e.preventDefault();
    const formData = new FormData(e.target)
    //formData.append("timeOffSet", TimeOffset());
    axios.post(mainUrl() + "/timer/" + props.ID + "/start", formData, {withCredentials: true})
    .then((response) => {
      console.log(response.data)
    })
    .catch(() => console.log("Didn't post successfully"))
  }

  return <form action={mainUrl() + "/timer/"+ toString(props.ID) +"/start"} method="post" name="form" encType="multipart/form-data" onSubmit={onSubmit}>
  seconds: <input id="seconds" type="number" name="seconds"></input>
  minutes: <input id="minutes" type="number" name="minutes"></input>
  hours: <input id="hours" type="number" name="hours"></input>
  days: <input id="days" type="number" name="days"></input>
  weeks: <input id="weeks" type="number" name="weeks"></input><br></br>
  <button>Start</button></form>
}

function Home(props){ //the home page that allows the creation of timer, finding the timer your in control of and finding a specific timer
  const [chosenID,setID] = useState("")
  const handleInput = event => {
    setID(event.target.value);
  };

  const [cookies, setCookie, removeCookie] = useCookies(["ID"]);

  return <><button onClick={() => props.setLoc({"Loc": "newTimer"})}>New Timer</button>
  <button onClick={() => props.setLoc({"Loc": "Timer", "ID": cookies["ID"]})}>Timer in control</button>
  <br></br>
  <h1>Type in your timer ID</h1>
  <br></br>
  <input type="number" name='IDinput' onChange={handleInput}></input>
  <br></br>
  <button onClick={() => props.setLoc({"Loc": "Timer", "ID": Number(chosenID), "error": undefined})}>Done</button></>
}

function NewTimer(props){ //creates the new timer
  const onSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target)
    axios.post(mainUrl() + "/newTimer", formData, {withCredentials: true})
    .then((response) => {
      props.setLoc({"Loc": "Timer", "ID": response.data, "error": undefined}) //response.data is the ID of the new timer
    })
    .catch(() => console.log("Didn't post successfully"))
  }

  return<><button onClick={() => props.setLoc({"Loc": "Home"})}>Home</button><br>
  </br><form action={mainUrl() + "/newTimer"} method="post" name="form" onSubmit={onSubmit}>
    <h1>New Timer</h1><br></br>
    <input type="password" id="password" name="password" placeholder="password"></input>
    <button type="submit">create</button>
  </form></>
}

function TimerLogin(props){ //allows the user to control the timer if there is a right password provided
  const onSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target)
    axios.post(mainUrl() + "/timer/" + props.ID + "/cred", formData, {withCredentials: true})
    .then((response) => {
      if(response.data == "Invalid"){ //if logged in isn't successful
        props.setLoc({"Loc": "Timer", "ID": props.ID, "error": "Invalid"})
      }else{ //if logged in is successful
        props.setCookie("ID", props.ID)
      }
    })
    .catch(() => console.log("Didn't post successfully"))
  }
  if(props.error == undefined){//if is for what happens if there isn't or is an error with the password
    return<><form method="post" name="form" onSubmit={onSubmit}>
    <h2>Timer Control</h2><br></br>
    <input type="password" id="password" name="password" placeholder="password"></input><br></br>
    <button type="submit">control</button>
    </form></>
  }else{ //if password is incorrect
    return<><form method="post" name="form" onSubmit={onSubmit}>
    <h2>Timer Control</h2><br></br>
    <input type="password" id="password" name="password" placeholder="password"></input><br></br>
    <button type="submit">control</button><br></br>
    <small>Invalid password</small>
    </form></>
  }
}

function App(){
  const [appLoc, setLoc] = useState({"Loc": "Home"}) //this state would be where the user wants to be in the react app
  switch(appLoc["Loc"]){
    case "Home":
      return <Home setLoc={setLoc}/>
    case "Timer":
      return <TimerPage ID={appLoc["ID"]} setLoc={setLoc} error={appLoc["error"]}/>
    case "newTimer":
      return <NewTimer setLoc={setLoc}/>
    default:
      return <TimerAmount/>
  }
}

root.render(
  <App/>

);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();