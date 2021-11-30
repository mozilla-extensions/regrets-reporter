import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { GetStartedFlow } from './GetStartedFlow';

import './index.css';
import '../common/fonts/changa.css';
import '../common/fonts/zilla-slab.css';
import '../common/fonts/nunito-sans.css';

const init = async () => {
	ReactDOM.render(<GetStartedFlow />, document.getElementById('app'));
};
init();
