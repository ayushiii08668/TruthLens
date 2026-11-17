const bcrypt = require('bcryptjs');

class MockStore {
  constructor() {
    this.users = [];
    this.investigations = [];
    this.reports = [];
    this.savedReports = [];
  }

  reset() {
    this.users = [];
    this.investigations = [];
    this.reports = [];
    this.savedReports = [];
  }

  createId() {
    return '507f1f77bcf86cd7994390' + Math.floor(10 + Math.random() * 89);
  }
}

const store = new MockStore();

module.exports = store;

