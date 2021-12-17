import React, { Component } from "react";
import { setInterview } from "helpers/reducers";
import axios from "axios";

import classnames from "classnames";
import Loading from "./Loading";
import Panel from "./Panel";
import  data from "../helpers/sampleData"

class Dashboard extends Component {
  state = {
    loading: false,
    focused: null,
    days: [],
    appointments: {},
    interviewers: {},
  };

  selectPanel = id => {
    this.setState(previousState => ({
      focused: previousState.focused !== null ? null : id
    }));
   }

   componentDidMount() {
    const focused = JSON.parse(localStorage.getItem("focused"));

    if (focused) {
      this.setState({ focused });
    }

    Promise.all([
      axios.get('http://localhost:8001/api/days'),
      axios.get('http://localhost:8001/api/appointments'),
      axios.get('http://localhost:8001/api/interviewers')
    ]).then(([days, appointments, interviewers]) => {
      this.setState({
        loading: false,
        days: days.data,
        appointments: appointments.data,
        interviewers: interviewers.data
      });
    });

    this.socket = new WebSocket(process.env.REACT_APP_WEBSOCKET_URL);

    this.socket.onmessage = event => {
      const data = JSON.parse(event.data);
    
      if (typeof data === "object" && data.type === "SET_INTERVIEW") {
        this.setState(previousState =>
          setInterview(previousState, data.id, data.interview)
        );
      }
    };
  }

  componentDidUpdate(previousProps, previousState) {
    if (previousState.focused !== this.state.focused) {
      localStorage.setItem("focused", JSON.stringify(this.state.focused));
    }
  }

  componentWillUnmount() {
    this.socket.close();
  }

  render() {
    const dashboardClasses = classnames("dashboard", {
      "dashboard--focused": this.state.focused
     });

    if (this.state.loading) {
      return <Loading />;
    }
    console.log(this.state)
    const panels = data
      .filter(
        panel => this.state.focused === null || this.state.focused === panel.id
      )
      .map(panel => (
        <Panel
        key={panel.id}
        label={panel.label}
        value={panel.getValue(this.state)}
          onSelect={event => this.selectPanel(panel.id)}
        />
    ));

    return <main className={dashboardClasses}>{panels}</main>;
  }
}
export default Dashboard;
