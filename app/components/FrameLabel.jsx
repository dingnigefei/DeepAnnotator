import React from "react";
import Nouislider from "./slider/NouisliderWrapper.jsx";

import Select from "react-select-plus";
import "react-select-plus/dist/react-select-plus.css";

export default class FrameLabel extends React.Component {
  // similar to componentWillMount in ES5
  constructor(props) {
    super(props);

    this.state = {
      labels: [],
      select: null,
      hasStarted: false,
      textVal: ""
    };

    this.handleSelect = this.handleSelect.bind(this);
    this.handleTextChange = this.handleTextChange.bind(this);
    this.handleAddText = this.handleAddText.bind(this);
  }

  componentDidMount() {
    this.handleClick(true, true);
  }

  getCurrentOption() {
    var self = this;

    for (var i = 0; i < self.state.labels.length; i++) {
      var label = self.state.labels[i];
      if (self.props.currentFrame >= label[0] && self.props.currentFrame <= label[1]) {
        return 1;
      }
    }

    return 0; // empty
  }

  getData() {
    var data = {}
    data["labels"] = this.state.labels;
    data["select"] = this.state.select;
    return data;
  }

  setData(data) {
    this.setState({
      labels: data["labels"],
      select: data["select"],
      hasStarted: false
    });
    this.props.saved();
  }

  mergeIntervals(intervals) {
    // Test if the given set has at least one interval
    if (intervals.length <= 1) {
      return intervals;
    }

    // Create an empty stack of intervals
    var stack = [], last;

    // sort the intervals based on start time
    intervals.sort(function(a,b) {
      return a[0] - b[0];
    });

    // push the first interval to stack
    stack.push(intervals[0]);

    // Start from the next interval and merge if necessary
    for (var i = 1, len = intervals.length; i < len; i++) {
      // get interval from last item
      last = stack[stack.length-1];

      // if current interval is not overlapping with stack top,
      // push it to the stack
      if (last[1] <= intervals[i][0]) {
        stack.push( intervals[i]);
      }

      // Otherwise update the ending time of top if ending of current
      // interval is more
      else if (last[1] < intervals[i][1]) {
        last[1] = intervals[i][1];
        stack.pop();
        stack.push(last);
      }
    }

    return stack;
  }

  handleClick(isStartButton) {
    var self = this;

    if (self.state.hasStarted == isStartButton) {
      return;
    }

    var currentFrame = self.props.currentFrame;
    var labels = self.state.labels;

    if (self.state.hasStarted) {
      for (var i = 0; i < labels.length; i++) {
        if (labels[i][1] == -1) {
          if (currentFrame > labels[i][0]) {
            labels[i][1] = currentFrame;
            labels = self.mergeIntervals(labels);
          } else if (currentFrame < labels[i][0]) {
            labels[i][1] = labels[i][0];
            labels[i][0] = currentFrame;
            labels = self.mergeIntervals(labels);
          } else {
            labels.splice(i, 1); // remove interval of length 0
          }
          break;
        }
      }
    } else {
      if (labels.length == 0 || currentFrame >= labels[labels.length-1][0]) {
        labels.push([currentFrame, -1]);
      } else {
        for (var i = 0; i < labels.length; i++) {
          if (labels[i][0] > currentFrame) {
            labels.splice(i, 0, [currentFrame, -1]);
          }
        }
      }
    }

    self.setState({
      labels: labels,
      hasStarted: !self.state.hasStarted
    });
    self.props.notSaved();
  }

  handleChange(handles, index) {
    var self = this;
    var labels = self.state.labels;

    var value = parseInt(handles[index]);
    labels[Math.floor(index/2)][index%2] = value;

    self.setState({
      labels: labels
    });
    self.props.setCurrentFrame(value);
    self.props.notSaved();
  }

  getHandles() {
    var self = this;
    if (self.state.labels.length == 0) {
      return [0];
    }

    var handles = [];
    for (var i = 0; i < self.state.labels.length; i++) {
      handles.push(self.state.labels[i][0]);
      if (self.state.labels[i][1] != -1) {
        handles.push(self.state.labels[i][1]);
      }
    }

    return handles;
  }

  getIntervals() {
    var self = this;
    var intervals = [];

    for (var i = 0; i < self.state.labels.length; i++) {
      var label = self.state.labels[i];

      if (label[1] == -1) {
        continue;
      }

      var start = 100*label[0]/self.props.numFrames;
      var length = 100*(label[1]-label[0]+1)/self.props.numFrames;

      intervals.push([start, length]);
    }

    return intervals;
  }

  handleSelect(select) {
    var self = this;
    console.log("selected value", select);

    self.setState({
      select: select
    });
    self.props.notSaved();
  }

  handleAddText() {
    var self = this;
    var selectOptions = self.props.selectOptions;

    var textVal = self.state.textVal;
    console.log("Click", textVal);

    selectOptions[0].options.push({
      label: textVal,
      value: textVal
    });
    console.log("Menu:", selectOptions);
    self.props.updateFrameSelectOptions(selectOptions);
  }

  handleTextChange(event) {
    var self = this;
    var text = event.target.value;
    console.log("text value", self.state.textVal);

    self.setState({
      textVal: text
    });
  }

  render() {
    var self = this;
    var handles = self.getHandles();
    var intervals = self.getIntervals();

    return (
      <div className={"label-info frame-label-info"}>
        <button type="button" className="close" aria-label="Close" onClick={self.props.closeLabel.bind(self, self.props.id)}>
          <span aria-hidden="true">&times;</span>
        </button>

        <div className="label-header row">
          <p className="label-text col-lg-3 col-md-3 col-sm-3">{"Frame "+self.props.id}</p>
          <div className="label-add-class input-group col-lg-5 col-md-5 col-sm-5">
            <input type="text" className="form-control" id="name" placeholder="New Class" value={self.state.textVal} onChange={self.handleTextChange} />
            <span className="input-group-btn">
              <button type="button" className="btn btn-default" onClick={self.handleAddText}>
                <span className="glyphicon glyphicon-plus-sign"></span> Add Class
              </button>
            </span>
          </div>
          <Select className="label-select col-lg-8 col-md-8 col-sm-8 col-lg-offset-1 col-md-offset-1 col-sm-offset-1" name="form-field-name" options={self.props.selectOptions} onChange={self.handleSelect} value={self.state.select} searchable={true} clearable={true} />
        </div>

        <div className="btn-group" data-toggle="buttons">
          <label className={"btn btn-danger col-lg-6 col-md-6 col-sm-6"+(self.state.hasStarted?" disabled":"")} onClick={self.handleClick.bind(self, true)}>
            <input type="radio" name="options" id="option1" autoComplete="off" /> Start
          </label>
          <label className={"btn btn-gray col-lg-6 col-md-6 col-sm-6"+(self.state.hasStarted?"":" disabled")} onClick={self.handleClick.bind(self, false)}>
            <input type="radio" name="options" id="option2" autoComplete="off" /> End
          </label>
        </div>

        <div className="label-slider">
          <Nouislider
            ref={"Nouislider"}
            range={{min: 0, max: self.props.numFrames==0?1:self.props.numFrames}}
            step={1}
            margin={1}
            start={handles}
            animate={false}
            onChange={self.handleChange.bind(self)}
            disabled={self.state.hasStarted || self.props.isPlaying}
            tooltips
          />
          {
            intervals.map(function(interval, index) {
              var bg = " slider-danger";

              if (index == 0) {
                bg += " slider-left"
              }
              if (index == self.state.labels.length-1) {
                bg += " slider-right"
              }

              return (
                <div className={"slider-connect"+bg} key={index} style={{left: interval[0]+"%", width: interval[1]+"%"}}></div>
              );
            })
          }
        </div>
      </div>
    );
  }
}

FrameLabel.propTypes = {
  id: React.PropTypes.number.isRequired,
  numFrames: React.PropTypes.number.isRequired,
  isPlaying: React.PropTypes.bool.isRequired
};

FrameLabel.defaultProps = {
};
