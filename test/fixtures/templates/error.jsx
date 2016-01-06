import React, { Component, PropTypes } from "react";

export default class Error extends Component {
   static propTypes = {
      message: PropTypes.string.isRequired,
      error: PropTypes.object,
      stack: PropTypes.string
   }
   render() {
      const {message, error, stack} = this.props;

      let body;
      if(error){
         body = (
            <pre>
               {JSON.stringify(error)}
            </pre>
         );
      }
      else if(stack){
         body = (
            <pre>
               {stack}
            </pre>
         );
      }
      return (
         <div>
            <p>
               <strong>
                  {message}
               </strong>
            </p>
            {body}
         </div>
      );
   }
}
