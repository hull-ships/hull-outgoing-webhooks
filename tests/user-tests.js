/* global describe, it */
import sinon from "sinon";
import hullSpy from "./mocks/hull";
import axios from "axios";
import moxios from "moxios";
import { equal } from "assert";
import updateUser from "../server/user-update";

const { events, segments, user, ship, changes } = require("./fixtures");
const message = { changes, events, segments, user };

function shipWithPrivateSettings(private_settings = {}, s = ship) {
  return {
    ...s,
    private_settings: {
      ...s.private_settings,
      ...private_settings
    }
  };
}

const TESTS = {
  simple: {
    payload: "traits({ test: 'trait' });",
    result: { test: "trait" }
  },
  complex: {
    payload: "traits({ test:10 }); traits({ test:1 },{ source:'group' });",
    result: { test: 10, "group/test": 1 }
  },
  conflict: {
    payload: "traits({ test: 4, 'group/test': 1}); traits({ test: 2 }, { source: 'group' });",
    result: { test: 4, "group/test": 2 }
  },
  nested: {
    payload: "traits({ value: 'val0', group: { value: 'val1', group: { value: 'val2' } } } }, { source: 'group' });",
    result: { "traits_group/value": "val0", "traits_group/group/value": "val1", "traits_group/group/group/value": "val2" }
  },
};

function payload(p) {
  return TESTS[p].payload;
}


describe('mocking axios requests', function () {
  describe('across entire suite', function () {

    beforeEach(function () {
      // import and pass your custom axios instance to this method
      moxios.install()
    })

    afterEach(function () {
      // import and pass your custom axios instance to this method
      moxios.uninstall()
    })

    it("Should not call traits if no changes", (done) => {
      const s = shipWithPrivateSettings({
        zap_url: 'http://localhost/test',
        zap_segments: [{ segment, entered, left }],
        zap_attributes: [],
        zap_events: [],
      });
      updateUser({ message }, { hull: hullSpy(s, spy), ship: s });
      sinon.assert.neverCalledWithMatch(spy, "traits");
      sinon.assert.neverCalledWithMatch(spy, "track");

      moxios.wait(function () {
          let request = moxios.requests.mostRecent()
          request.respondWith({
            status: 200,
            response: [
              { id: 1, firstName: 'Fred', lastName: 'Flintstone' },
              { id: 2, firstName: 'Wilma', lastName: 'Flintstone' }
            ]
          }).then(function () {
            let list = document.querySelector('.UserList__Data')
            equal(list.rows.length, 2)
            equal(list.rows[0].cells[0].innerHTML, 'Fred')
            equal(list.rows[1].cells[0].innerHTML, 'Wilma')
            done()
          })
        })
      })


    });
  });
});
