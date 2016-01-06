import React, { Component, PropTypes } from "react";

export default class Template extends Component {
   static propTypes = {
      html: PropTypes.string,
      data: PropTypes.object,
      url: PropTypes.string
   }

   render() {
      const {html, data, url, meta} = this.props;

      return (
         <html lang="de" className="app">
         <head>
            <meta charSet="utf-8"/>
            {meta}
            <meta name="viewport" content="width=device-width, initial-scale=1"/>
            <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon"/>
            <link rel="stylesheet" href="/css/semantic.min.css"/>
            {DEBUG ? null : <link rel="stylesheet" href="/bundle.css"/>}
            <script dangerouslySetInnerHTML={{__html: `STANDALONE=true;ELECTRON=false;`}}/>
         </head>
         <body>
            <div id="app" dangerouslySetInnerHTML={{__html: html}} className="full"/>
            {data ? <script dangerouslySetInnerHTML={{__html: `window.__data=${JSON.stringify(data)};`}} /> : null}
            <script src="/js/jquery.min.js"/>
            <script src="/bundle.js"/>
         </body>
         </html>
      );
   }
}
