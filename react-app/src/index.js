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

function OffsetEndTime(props){
  var refresh = 1000;
  const [endTimeData, setEndTime] = useState({"endTime": NaN})
  const [offsetData, setOffsetData] = useState({"datetime": NaN, "computerTime": NaN}) //uses states to get value out of async function
  if (TimeLeft(endTimeData["endTime"] - (offsetData["datetime"] - offsetData["computerTime"])) > 0){ //this varies the setInteval rate to prevent CPU going 100% once timer goes to 0
    refresh = 105;
  }else{
    refresh = 1000;
  }
  useEffect(() =>{
    const refreshTimeOffset = setInterval(() =>{ //Updates to any change to the end time
      getServerComputerDateTime(setOffsetData); //gets offset data which is used to find the difference between server time and client time
      getTimerEndDate(setEndTime, props.ID); //gets the recorded end time from the server
    }, refresh)
    return () => clearInterval(refreshTimeOffset);
  });
  return endTimeData["endTime"] - (offsetData["datetime"] - offsetData["computerTime"]); //finds the difference between client time and server time and uses that to offset the end time
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
  return <table align="center" cellPadding={15}>
    <tr>
      <th>Seconds</th>
      <th>Minutes</th>
      <th>Hours</th>
      <th>Days</th>
      <th>Weeks</th>
    </tr>
    <tr>
      <td>{String(timeLeftBreakdown["seconds"])}</td>
      <td>{String(timeLeftBreakdown["minutes"])}</td>
      <td>{String(timeLeftBreakdown["hours"])}</td>
      <td>{String(timeLeftBreakdown["days"])}</td>
      <td>{String(timeLeftBreakdown["weeks"])}</td>
    </tr>
  </table>;

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
  const [cookies, setCookie, removeCookie] = useCookies(["name"]);
  if(cookies["name"] == props.ID){ //if the client is in control of the timer (can edit how long the timer times for)
    return <><button onClick={() => props.setLoc({"Loc": "Home"})}>Home</button>
    <body className="text-center">
      <br></br>
      <h1>Timer name: {props.ID}</h1>
      <p>Shows time remaining</p>
      <p>Time remaining is calculated from retrieving JSON objects from server, states used to get the JSON objects from asynchronous functions and time remaining is calulated by doing timeEndTime - (serverTime - clientTime) which takes into account time differences between server and client.</p>
      <p>useEffect and setInteval is used to automatically update the timer</p>
      <br></br>
      <Timer ID={props.ID} setLoc={props.setLoc}/><br></br><br></br>
      <TimerAmount ID={props.ID}/>
    </body></>;
  }else{ //if the client isn't in control of the timer
    return <><button onClick={() => props.setLoc({"Loc": "Home"})}>Home</button>
    <body className="text-center">
      <br></br>
      <h1>Timer name: {props.ID}</h1>
      <p>Shows time remaining</p>
      <p>Time remaining is calculated from retrieving JSON objects from server, states used to get the JSON objects from asynchronous functions and time remaining is calulated by doing timeEndTime - (serverTime - clientTime) which takes into account time differences between server and client.</p>
      <p>useEffect and setInteval is used to automatically update the timer</p>
      <br></br>
      <Timer ID={props.ID} setLoc={props.setLoc}/><br></br>
      <TimerLogin ID={props.ID} setLoc={props.setLoc} setCookie={setCookie}/>
    </body></>
  }
}

function TimerAmount(props){ //used to set how long the timer times for
  const onSubmit = (e) => { //behaviour of sending the form to the server
    e.preventDefault();
    var timeTogether = document.getElementById("seconds").value + document.getElementById("minutes").value + document.getElementById("hours").value + document.getElementById("days").value + document.getElementById("weeks").value;
    if(!(timeTogether == 0)){//if statement checks if anything is typed in the inputs so that there won't be 0 time
      const formData = new FormData(e.target)
      axios.post(mainUrl() + "/timer/" + props.ID + "/start", formData, {withCredentials: true})
      .then((response) => {
        console.log(response.data)
      })
      .catch(() => console.log("Didn't post successfully"))
    }
  }
  return <>
    <h2>Change Timer</h2><br></br>
    <p>This will allow you to change the timer duration</p>
    <form action={mainUrl() + "/timer/"+ toString(props.ID) +"/start"} method="post" name="form" encType="multipart/form-data" onSubmit={onSubmit}>
    <div class="col-xs-2">
        <table align="center">
          <tr>
            <th>Seconds</th>
            <th>Minutes</th>
            <th>Hours</th>
            <th>Days</th>
            <th>Weeks</th>
          </tr>
          <tr>
            <td><input className="form-control" id="seconds" type="number" name="seconds" min="0"></input></td>
            <td><input className="form-control" id="minutes" type="number" name="minutes" min="0"></input></td>
            <td><input className="form-control" id="hours" type="number" name="hours" min="0"></input></td>
            <td><input className="form-control" id="days" type="number" name="days" min="0"></input></td>
            <td><input className="form-control" id="weeks" type="number" name="weeks" min="0"></input></td>
          </tr>
      </table>
      </div>
      <button>Change Timer</button>
    </form>
  </>
}
function NewTimer(props){ //creates the new timer
  const [badName, setBadName] = useState("")
  const onSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target)
    axios.post(mainUrl() + "/newTimer", formData, {withCredentials: true})
    .then((response) => {
      if(response.data == "Done"){
        props.setLoc({"Loc": "Timer", "ID": document.getElementById("timerName").value})
      }else{
        setBadName("timer name already exists")
      }
    })
    .catch(() => console.log("Didn't post successfully"))
  }

  return<><body className="text-center">
    <form action={mainUrl() + "/newTimer"} method="post" name="form" onSubmit={onSubmit}>
      <h1>New Timer</h1>
      <p>This will allow you to create your own timer, name and salted hashed password is stored in SQLlite database</p>
      <p>Timer Name</p>
      <input type="text" id="timerName" name="timerName"></input>
      <p>Timer Password</p>
      <input type="password" id="password" name="password"></input><br></br>
      <button type="submit">create</button><br></br>
      <small>{badName}</small>
    </form>
  </body></>
}

function TimerLogin(props){ //allows the user to control the timer if there is a right password provided
  const [error, setError] = useState("") //the error message
  const onSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target)
    axios.post(mainUrl() + "/timer/" + props.ID + "/cred", formData, {withCredentials: true})
    .then((response) => {
      if(response.data == "Wrong Password"){ //if logged in isn't successful
        setError("Invalid password")
      }else{ //if logged in is successful
        props.setCookie("name", props.ID)
      }
    })
    .catch(() => console.log("Didn't post successfully"))
  }
  return<><body className="text-center">
    <form method="post" name="form" onSubmit={onSubmit}>
      <h2>Timer Control</h2><br></br>
      <p>By typing in the password you would be able to control the duration of the timer</p><br></br>
      <input type="password" id="password" name="password" placeholder="password"></input><br></br>
      <button type="submit">control</button><br></br>
      <small>{error}</small>
    </form>
  </body></>
}

const checkTimerExist = async (setData, timerID) =>{ //gets the time for the end of the countdown
  try{
    const resp = await fetch(mainUrl() +"/timer/" + timerID + "/exist");

    const data = await resp.json();

    setData(data);
  }catch(err){
    //alert(err);
  }
  
}

function TimerExist(ID){
  const [data, setData] = useState({"timerExist": NaN});
  if(isNaN(data["timerExist"])){
    checkTimerExist(setData, ID)
  }
  return data["timerExist"];
}

function TimerExistDecider(props){
  var timerExist = TimerExist(props.ID);
  if(timerExist == true){ //checks if timer exists and react accordingly
    return <TimerPage ID={props.ID} setLoc={props.setLoc}/>
  }else if(timerExist == false){
    return <>
    <body className="text-center">
      <h1>Timer doesn't exist</h1><br></br>
      <button onClick={() => props.setLoc({"Loc": "Home"})}>Home</button>
    </body>
    </>
  }
}

function Home(props){ //the home page that allows the creation of timer, finding the timer your in control of and finding a specific timer
  const [chosenID,setID] = useState("")
  const handleInput = event => {
    console.log(event.target.value == "")
    if(event.target.value != ""){ //checks if something is type in
      setID(event.target.value);
    }
  };

  const [cookies, setCookie, removeCookie] = useCookies(["name"]);

  return <><body className="text-center">
    <h1>Type in the name of an existing timer</h1>
    <p>This will bring you to a specified already existing timer stored in an SQLlite database. Will use react states to emulate going to another page</p>
    <input type="text" name='IDinput' onChange={handleInput}></input>
    <br></br>
    <button onClick={() => props.setLoc({"Loc": "Timer", "ID": String(chosenID)})}>Done</button>
  </body><br></br>
  <NewTimer setLoc={props.setLoc}/>
  <br></br>
  <body className="text-center">
    <p>Already have your own timer?</p>
    <a href="javascript:void(0);" onClick={() => props.setLoc({"Loc": "Timer", "ID": cookies["name"]})}>Click here to go to the timer your logged in on</a>
  </body>
  </>
}


function App(){
  const [appLoc, setLoc] = useState({"Loc": "Home"}) //this state would be where the user wants to be in the react app
  switch(appLoc["Loc"]){
    case "Home":
      return <Home setLoc={setLoc}/>
    case "Timer":
      return <TimerExistDecider ID={appLoc["ID"]} setLoc={setLoc}/>
    case "newTimer":
      return <NewTimer setLoc={setLoc}/>
    default:
      return <TimerAmount/>
  }
}

root.render( //bootstrap used to make page look better
  <><title>React Timer</title>
  <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous"></link>
    <App/></>

);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();