import React from "react";
import PropTypes from 'prop-types';
import { connect } from "react-redux";
import Sidebar from "react-sidebar";
import "whatwg-fetch"; // setup polyfill
import { loadJSONs } from "../actions/loadData";
import Background from "./framework/background";
import ToggleSidebarTab from "./framework/toggle-sidebar-tab";
import Controls from "./controls/controls";
// import Frequencies from "./charts/frequencies";
import { Entropy } from "./charts/entropy";
import Map from "./map/map";
import Info from "./info/info";
import Tree from "./tree";
import { controlsHiddenWidth, narrativeWidth, controlsWidth } from "../util/globals";
import { sidebarColor } from "../globalStyles";
import TitleBar from "./framework/title-bar";
import Footer from "./framework/footer";
import DownloadModal from "./download/downloadModal";
import { analyticsNewPage } from "../util/googleAnalytics";
import filesDropped from "../actions/filesDropped";
import Narrative from "./narrative";
import AnimationController from "./framework/animationController";

const nextstrainLogo = require("../images/nextstrain-logo-small.png");

const Contents = ({showSpinner, spinnerHeight, panels, padding, narrative}) => {
  if (showSpinner) {
    return (<img className={"spinner"} src={nextstrainLogo} alt="loading" style={{marginTop: spinnerHeight}}/>);
  }
  const show = (name) => panels.indexOf(name) !== -1;
  return (
    <Background>
      {narrative ? null : <Info padding={padding} />}
      {show("tree") ? <Tree padding={padding} /> : null}
      {show("map") ? <Map padding={padding} justGotNewDatasetRenderNewMap={false} /> : null}
      {show("entropy") ? <Entropy padding={padding} /> : null}
      {narrative ? null : <Footer padding={padding} />}
    </Background>
  );
};

@connect((state) => ({
  readyToLoad: state.datasets.ready,
  datapath: state.datasets.datapath,
  metadataLoaded: state.metadata.loaded,
  treeLoaded: state.tree.loaded,
  panelsToDisplay: state.controls.panelsToDisplay,
  displayNarrative: state.narrative.display,
  browserDimensions: state.browserDimensions.browserDimensions
}))
class App extends React.Component {
  constructor(props) {
    super(props);
    /* window listener to see when width changes cross thrhershold to toggle sidebar */
    /* A note on sidebar terminology:
    sidebarOpen (AFAIK) is only used via touch drag events
    sidebarDocked is the prop used on desktop.
    While these states could be moved to redux, they would need
    to be connected to here, triggering an app render anyways
    */
    const mql = window.matchMedia(`(min-width: ${controlsHiddenWidth}px)`);
    mql.addListener(() => this.setState({
      sidebarDocked: this.state.mql.matches
    }));
    this.state = {mql, sidebarDocked: mql.matches, sidebarOpen: false};
    analyticsNewPage();
  }
  static propTypes = {
    dispatch: PropTypes.func.isRequired
  }
  componentWillMount() {
    if (this.props.datapath) { /* datapath (pathname) only appears after manifest JSON has arrived */
      this.props.dispatch(loadJSONs());
    }
  }
  componentDidMount() {
    document.addEventListener("dragover", (e) => {e.preventDefault();}, false);
    document.addEventListener("drop", (e) => {
      e.preventDefault();
      return this.props.dispatch(filesDropped(e.dataTransfer.files));
    }, false);
  }
  componentDidUpdate(prevProps) {
    if (prevProps.datapath !== this.props.datapath) {
      this.props.dispatch(loadJSONs());
    }
  }
  render() {
    const padding = {
      left: this.state.sidebarOpen || this.state.sidebarDocked ? controlsWidth : 0,
      right: 0,
      top: 0,
      bottom: 0
    };
    return (
      <g>
        <AnimationController/>
        <DownloadModal/>
        <ToggleSidebarTab
          open={this.state.sidebarDocked}
          handler={() => {this.setState({sidebarDocked: !this.state.sidebarDocked});}}
          widthWhenOpen={controlsWidth}
          widthWhenShut={0}
        />
        <Sidebar
          sidebar={
            <div>
              <TitleBar minified/>
              {this.props.displayNarrative ? <Narrative/> : <Controls/>}
            </div>
          }
          open={this.state.sidebarOpen}
          docked={this.state.sidebarDocked}
          onSetOpen={(a) => {this.setState({sidebarOpen: a});}}
          sidebarClassName={"sidebar"}
          styles={{sidebar: {backgroundColor: sidebarColor, height: "100%", overflow: "hidden"}}}
        >
          <Contents
            showSpinner={!this.props.treeLoaded || !this.props.metadataLoaded}
            spinnerHeight={`${this.props.browserDimensions.height / 2 - 100}px`}
            panels={this.props.panelsToDisplay}
            padding={padding}
            narrative={this.props.displayNarrative}
          />
        </Sidebar>
      </g>
    );
  }
}

export default App;
