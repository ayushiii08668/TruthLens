const store = require('./mockDb');
const bcrypt = require('bcryptjs');

// --- Mock User ---
function MockUser(data) {
  Object.assign(this, data);
  this._id = data._id || store.createId();
  this.createdAt = new Date();
  this.updatedAt = new Date();
}

MockUser.prototype.save = async function() {
  if (this.passwordHash && !this.passwordHash.startsWith('$2a$') && !this.passwordHash.startsWith('$2b$')) {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  }
  const idx = store.users.findIndex(u => u._id.toString() === this._id.toString());
  if (idx >= 0) {
    store.users[idx] = this;
  } else {
    store.users.push(this);
  }
  return this;
};

MockUser.prototype.comparePassword = async function(cand) {
  return bcrypt.compare(cand, this.passwordHash);
};

MockUser.findOne = function(query) {
  const result = store.users.find(u => {
    if (query.email && u.email.toLowerCase() === query.email.toLowerCase()) return true;
    if (query.resetPasswordToken && u.resetPasswordToken === query.resetPasswordToken) {
      if (query.resetPasswordExpire && query.resetPasswordExpire.$gt) {
        return u.resetPasswordExpire > query.resetPasswordExpire.$gt;
      }
      return true;
    }
    return false;
  }) || null;

  return {
    select: (field) => Promise.resolve(result),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject)
  };
};

MockUser.findById = async function(id) {
  return store.users.find(u => u._id.toString() === id.toString()) || null;
};

// --- Mock Investigation ---
function MockInvestigation(data) {
  Object.assign(this, data);
  this._id = data._id || store.createId();
  this.createdAt = new Date();
  this.updatedAt = new Date();
}

MockInvestigation.prototype.save = async function() {
  const idx = store.investigations.findIndex(inv => inv._id.toString() === this._id.toString());
  if (idx >= 0) {
    store.investigations[idx] = this;
  } else {
    store.investigations.push(this);
  }
  return this;
};

MockInvestigation.find = function(filter = {}) {
  let list = store.investigations.filter(inv => {
    if (filter.userId && inv.userId.toString() !== filter.userId.toString()) return false;
    if (filter.status && inv.status !== filter.status) return false;
    if (filter.inputType && inv.inputType !== filter.inputType) return false;
    return true;
  });

  const queryObj = {
    sort: () => queryObj,
    skip: (n) => {
      list = list.slice(n);
      return queryObj;
    },
    limit: (n) => {
      list = list.slice(0, n);
      return queryObj;
    },
    lean: () => Promise.resolve(list),
    then: (resolve, reject) => Promise.resolve(list).then(resolve, reject)
  };
  return queryObj;
};

MockInvestigation.countDocuments = async function(filter = {}) {
  return store.investigations.filter(inv => {
    if (filter.userId && inv.userId.toString() !== filter.userId.toString()) return false;
    if (filter.status && inv.status !== filter.status) return false;
    return true;
  }).length;
};

MockInvestigation.findById = function(id) {
  const item = store.investigations.find(inv => inv._id.toString() === id.toString()) || null;
  return {
    lean: () => Promise.resolve(item),
    then: (resolve, reject) => Promise.resolve(item).then(resolve, reject)
  };
};

MockInvestigation.findByIdAndDelete = async function(id) {
  const idx = store.investigations.findIndex(inv => inv._id.toString() === id.toString());
  if (idx >= 0) {
    const deleted = store.investigations.splice(idx, 1)[0];
    return deleted;
  }
  return null;
};

MockInvestigation.aggregate = async function(pipeline) {
  const counts = {};
  store.investigations.forEach(inv => {
    counts[inv.inputType] = (counts[inv.inputType] || 0) + 1;
  });
  return Object.entries(counts).map(([k, v]) => ({ _id: k, count: v }));
};

// --- Mock VerificationReport ---
function MockVerificationReport(data) {
  Object.assign(this, data);
  this._id = data._id || store.createId();
  this.createdAt = new Date();
  this.updatedAt = new Date();
}

MockVerificationReport.prototype.save = async function() {
  const idx = store.reports.findIndex(r => r._id.toString() === this._id.toString());
  if (idx >= 0) {
    store.reports[idx] = this;
  } else {
    store.reports.push(this);
  }
  return this;
};

MockVerificationReport.findOne = function(filter = {}) {
  const item = store.reports.find(r => {
    if (filter.shareId && r.shareId !== filter.shareId) return false;
    if (filter.isPublic !== undefined && r.isPublic !== filter.isPublic) return false;
    return true;
  }) || null;

  const queryObj = {
    populate: () => queryObj,
    lean: () => Promise.resolve(item),
    then: (resolve, reject) => Promise.resolve(item).then(resolve, reject)
  };
  return queryObj;
};

MockVerificationReport.insertMany = async function(docs) {
  const inserted = docs.map(d => new MockVerificationReport(d));
  store.reports.push(...inserted);
  return inserted;
};

MockVerificationReport.find = function(filter = {}) {
  let list = store.reports.filter(r => {
    if (filter.investigationId && r.investigationId.toString() !== filter.investigationId.toString()) return false;
    if (filter.userId && r.userId.toString() !== filter.userId.toString()) return false;
    return true;
  });

  const queryObj = {
    populate: () => queryObj,
    sort: () => queryObj,
    limit: (n) => {
      list = list.slice(0, n);
      return queryObj;
    },
    lean: () => Promise.resolve(list),
    then: (resolve, reject) => Promise.resolve(list).then(resolve, reject)
  };
  return queryObj;
};

MockVerificationReport.findById = function(id) {
  const item = store.reports.find(r => r._id.toString() === id.toString()) || null;
  const queryObj = {
    populate: () => queryObj,
    lean: () => Promise.resolve(item),
    then: (resolve, reject) => Promise.resolve(item).then(resolve, reject)
  };
  return queryObj;
};

MockVerificationReport.countDocuments = async function(filter = {}) {
  return store.reports.filter(r => {
    if (filter.userId && r.userId.toString() !== filter.userId.toString()) return false;
    return true;
  }).length;
};

MockVerificationReport.aggregate = async function(pipeline) {
  // Simple simulation of verdict aggregation
  const result = [];
  const verdictMap = {};

  store.reports.forEach(r => {
    if (!verdictMap[r.verdict]) {
      verdictMap[r.verdict] = { count: 0, totalConf: 0 };
    }
    verdictMap[r.verdict].count++;
    verdictMap[r.verdict].totalConf += (r.confidence || 0);
  });

  for (const [k, v] of Object.entries(verdictMap)) {
    result.push({
      _id: k,
      count: v.count,
      avgConfidence: v.count > 0 ? v.totalConf / v.count : 0
    });
  }
  return result;
};

MockVerificationReport.deleteMany = async function(filter = {}) {
  if (filter.investigationId) {
    store.reports = store.reports.filter(r => r.investigationId.toString() !== filter.investigationId.toString());
  }
  return { acknowledged: true };
};

// --- Mock SavedReport ---
function MockSavedReport(data) {
  Object.assign(this, data);
  this._id = data._id || store.createId();
  this.createdAt = new Date();
  this.updatedAt = new Date();
}

MockSavedReport.prototype.save = async function() {
  store.savedReports.push(this);
  return this;
};

MockSavedReport.findOne = async function(filter) {
  return store.savedReports.find(s => 
    s.userId.toString() === filter.userId.toString() &&
    s.reportId.toString() === filter.reportId.toString()
  ) || null;
};

MockSavedReport.findOneAndDelete = async function(filter) {
  const idx = store.savedReports.findIndex(s => 
    s.userId.toString() === filter.userId.toString() &&
    s.reportId.toString() === filter.reportId.toString()
  );
  if (idx >= 0) {
    return store.savedReports.splice(idx, 1)[0];
  }
  return null;
};

MockSavedReport.find = function(filter = {}) {
  let list = store.savedReports.filter(s => {
    if (filter.userId && s.userId.toString() !== filter.userId.toString()) return false;
    return true;
  });

  const queryObj = {
    populate: () => queryObj,
    sort: () => queryObj,
    skip: (n) => {
      list = list.slice(n);
      return queryObj;
    },
    limit: (n) => {
      list = list.slice(0, n);
      return queryObj;
    },
    lean: () => Promise.resolve(list.map(item => {
      const report = store.reports.find(r => r._id.toString() === item.reportId.toString());
      return {
        ...item,
        reportId: report || null
      };
    })),
    then: (resolve, reject) => Promise.resolve(list).then(resolve, reject)
  };
  return queryObj;
};

MockSavedReport.countDocuments = async function(filter = {}) {
  return store.savedReports.filter(s => {
    if (filter.userId && s.userId.toString() !== filter.userId.toString()) return false;
    return true;
  }).length;
};

MockSavedReport.deleteMany = async function(filter = {}) {
  if (filter.reportId && filter.reportId.$in) {
    const ids = filter.reportId.$in.map(id => id.toString());
    store.savedReports = store.savedReports.filter(s => !ids.includes(s.reportId.toString()));
  }
  return { acknowledged: true };
};

module.exports = {
  User: MockUser,
  Investigation: MockInvestigation,
  VerificationReport: MockVerificationReport,
  SavedReport: MockSavedReport
};
