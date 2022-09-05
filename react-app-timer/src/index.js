import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import axios from 'axios';
//import App from './App';
import reportWebVitals from './reportWebVitals';
import { useCookies } from 'react-cookie';

const root = ReactDOM.createRoot(document.getElementById('root'));

function mainUrl(){ //just used for development reasons
  return "http://localhost:5000";
  //return "";
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

const CurrentLoggedInTimerGet = async (setData) =>{ //gets the time for the end of the countdown
  try{
    const resp = await fetch(mainUrl() +"/getCurrentTimerID");

    const data = await resp.json();
  
    setData(data);
  }catch(err){
    //alert(err);
  }
  
}

function CurrentTimer(){
  const [data, setData] = useState({"ID": NaN})
  if(isNaN(data["ID"])){
    CurrentLoggedInTimerGet(setData);
  }
  return data;
}

function TimeOffset(){ //finds the offset between what the computer thinks the time is as well as the server
  const [data, setData] = useState({"datetime": NaN, "computerTime": NaN}) //uses states to get value out of async function
  if(isNaN(data["datetime"])){
    getServerComputerDateTime(setData);
  }
  var timeOffset = data["datetime"] - data["computerTime"];
  return timeOffset;
}

function EndTime(props){ //returns what the end time is
  const [data, setData] = useState({"endTime": NaN}) //uses states to get value out of async function
  if(isNaN(data["endTime"])){
    getTimerEndDate(setData, props.ID);
  }
  return data["endTime"];
}

function OffsetEndTime(props){ //returns what the end time is taking into account any difference in believed time between the server as well as the computer
  var CompDateTime = EndTime(props) - TimeOffset();
  return CompDateTime;
}

function TimeLeft(localEndTime){ //works out how long is left of the time
  var currentTime = (new Date()).getTime();
  var time = localEndTime - currentTime;
  if(time > 0){
    return time;
  }
  return time;
}


function timeLeftBreak(timeM){//this calculates the weeks days hours minutes and seconds it will take for the bid to close
  timeM = timeM / 1000; //makes it into seconds only
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
  return {"seconds": seconds, "minutes": minutes, "hours": hours, "days": days, "weeks": weeks};
}

function DisplayTimeLeft(time){ //makes the value of how long is left of the timer in a presentable manner that can be displayed to the user
  if(!isNaN(time)){
    var timeLeftBreakdown = timeLeftBreak(time);
    var presentString = ""
    presentString = presentString + timeLeftBreakdown["seconds"] + " seconds, "
    presentString = presentString + timeLeftBreakdown["minutes"] + " minutes, "
    presentString = presentString + timeLeftBreakdown["hours"] + " hours, "
    presentString = presentString + timeLeftBreakdown["days"] + " days, "
    presentString = presentString + timeLeftBreakdown["weeks"] + " weeks"
    return presentString;
  }

}

function Timer(props){
  const localEndTime = OffsetEndTime(props)
  if(localEndTime < 10000){
    props.setLoc({"Loc": "Home"})
  }
  const [remainTime, getRemainTime] = useState(0);
  useEffect(() =>{
    const refreshTimer = setInterval(() =>{
      getRemainTime(TimeLeft(localEndTime));
    }, 1)
    return () => clearInterval(refreshTimer);
  });
  //return <DisplayTimeLeft time={remainTime}/>
  return DisplayTimeLeft(remainTime);
}

function ControlButton(props){
  return <button>Control Timer</button>
}

function TimerPage(props){
  
  const [cookies, setCookie, removeCookie] = useCookies(["ID"]);
  if(cookies["ID"] == props.ID){
    return <><button onClick={() => props.setLoc({"Loc": "Home"})}>Home</button>
    <br></br>
    <h1>Timer number {props.ID}</h1>
    <br></br>
    <Timer ID={props.ID} setLoc={props.setLoc}/><br></br><br></br>
    <TimerAmount ID={props.ID}/></>;
  }else{
    return <><button onClick={() => props.setLoc({"Loc": "Home"})}>Home</button><ControlButton/>
    <br></br>
    <h1>Timer number {props.ID}</h1>
    <br></br>
    <Timer ID={props.ID} setLoc={props.setLoc}/><br></br></>
  }
}

function TimerAmount(props){

  return <form action={mainUrl() + "/timer/"+ toString(props.ID) +"/start"} method="post" name="form" encType="multipart/form-data">
  seconds: <input id="seconds" name="seconds"></input>
  minutes: <input id="minutes" name="minutes"></input>
  hours: <input id="hours" name="hours"></input>
  days: <input id="days" name="days"></input>
  weeks: <input id="weeks" name="weeks"></input><br></br>
  <button>Start</button></form>
}

function Home(props){
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
  <input type="text" name='IDinput' onChange={handleInput}></input>
  <br></br>
  <button onClick={() => props.setLoc({"Loc": "Timer", "ID": Number(chosenID)})}>Done</button></>
}

function NewTimer(props){
  const [cookies, setCookie, removeCookie] = useCookies(["ID"]);
  const onSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target)
    axios.post(mainUrl() + "/newTimer", formData, {withCredentials: true})
    .then((response) => {
      console.log(response.data)
      //setCookie("ID",response.data["ID"])
      //setCookie("session", response.data["session"])
      props.setLoc({"Loc": "Timer", "ID": response.data})
    })
    .catch(() => console.log("Didn't post successfully"))
  }

  return<form action={mainUrl() + "/newTimer"} method="post" name="form" onSubmit={onSubmit}>
    <h1>New Timer</h1><br></br>
    <input type="password" id="password" name="password"></input>
    <button type="submit">create</button>
  </form>
}

function App(){
  const [appLoc, setLoc] = useState({"Loc": "Home"}) //this state would be where the user wants to be in the react app
  switch(appLoc["Loc"]){
    case "Home":
      return <Home setLoc={setLoc}/>
    case "Timer":
      return <TimerPage ID={appLoc["ID"]} setLoc={setLoc}/>
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