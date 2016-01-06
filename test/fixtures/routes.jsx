import React from 'react';
import {Route} from 'react-router';
import Hello from './components/hello';

export default function(handler){
   return (
      <Route path="/" component={Hello}></Route>
   )
}
