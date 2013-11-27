var path = require('path');

var Binding = require('../../lib/binding').Binding;
var Directory = require('../../lib/directory').Directory;
var File = require('../../lib/file').File;
var FileSystem = require('../../lib/filesystem');
var helper = require('../helper');

var assert = helper.assert;
var flags = helper.flags;

var constants = process.binding('constants');

describe('Binding', function() {

  var system;
  beforeEach(function() {
    system = FileSystem.create({
      'mock-dir': {
        'one.txt': 'one content',
        'two.txt': FileSystem.file({
          content: 'two content',
          mode: 0644,
          atime: new Date(1),
          ctime: new Date(2),
          mtime: new Date(3)
        }),
        'three.bin': new Buffer([1, 2, 3]),
        'empty': {}
      }
    });
  });

  describe('constructor', function() {

    it('creates a new instance', function() {
      var binding = new Binding(system);
      assert.instanceOf(binding, Binding);
    });

  });

  describe('#getSystem()', function() {
    var binding = new Binding(system);
    assert.equal(binding.getSystem(), system);
  });

  describe('#setSystem()', function() {
    var firstSystem = new FileSystem();
    var binding = new Binding(firstSystem);
    assert.equal(binding.getSystem(), firstSystem);

    binding.setSystem(system);
    assert.equal(binding.getSystem(), system);
  });

  describe('#Stats', function() {

    it('is a stats constructor', function() {
      var binding = new Binding(system);
      assert.isFunction(binding.Stats);
    });
  });

  describe('#stat()', function() {

    it('calls callback with a Stats instance', function(done) {
      var binding = new Binding(system);
      binding.stat(path.join('mock-dir', 'one.txt'), function(err, stats) {
        if (err) {
          return done(err);
        }
        assert.instanceOf(stats, binding.Stats);
        done();
      });
    });

    it('returns a Stats instance when called synchronously', function() {
      var binding = new Binding(system);
      var stats = binding.stat(path.join('mock-dir', 'one.txt'));
      assert.instanceOf(stats, binding.Stats);
    });

    it('identifies files (async)', function(done) {
      var binding = new Binding(system);
      binding.stat(path.join('mock-dir', 'one.txt'), function(err, stats) {
        if (err) {
          return done(err);
        }
        assert.equal(stats.mode & constants.S_IFMT, constants.S_IFREG);
        done();
      });
    });

    it('identifies files (sync)', function() {
      var binding = new Binding(system);
      var stats = binding.stat(path.join('mock-dir', 'one.txt'));
      assert.equal(stats.mode & constants.S_IFMT, constants.S_IFREG);
    });

    it('identifies directories (async)', function(done) {
      var binding = new Binding(system);
      binding.stat('mock-dir', function(err, stats) {
        if (err) {
          return done(err);
        }
        assert.equal(stats.mode & constants.S_IFMT, constants.S_IFDIR);
        done();
      });
    });

    it('identifies directories (sync)', function() {
      var binding = new Binding(system);
      var stats = binding.stat('mock-dir');
      assert.equal(stats.mode & constants.S_IFMT, constants.S_IFDIR);
    });

    it('includes atime, ctime, and mtime', function(done) {
      var binding = new Binding(system);
      binding.stat(path.join('mock-dir', 'two.txt'), function(err, stats) {
        if (err) {
          return done(err);
        }
        assert.equal(stats.atime.getTime(), new Date(1).getTime());
        assert.equal(stats.ctime.getTime(), new Date(2).getTime());
        assert.equal(stats.mtime.getTime(), new Date(3).getTime());
        done();
      });
    });

    it('includes mode with file permissions (default)', function(done) {
      var binding = new Binding(system);
      binding.stat(path.join('mock-dir', 'one.txt'), function(err, stats) {
        if (err) {
          return done(err);
        }
        assert.equal(stats.mode & 0777, 0666);
        done();
      });
    });

    it('includes mode with file permissions (custom)', function(done) {
      var binding = new Binding(system);
      binding.stat(path.join('mock-dir', 'two.txt'), function(err, stats) {
        if (err) {
          return done(err);
        }
        assert.equal(stats.mode & 0777, 0644);
        done();
      });
    });

    it('includes size in bytes (async)', function(done) {
      var binding = new Binding(system);
      binding.stat(path.join('mock-dir', 'two.txt'), function(err, stats) {
        if (err) {
          return done(err);
        }
        assert.equal(stats.size, 11);
        done();
      });
    });

    it('includes size in bytes (sync)', function() {
      var binding = new Binding(system);
      var stats = binding.stat(path.join('mock-dir', 'three.bin'));
      assert.equal(stats.size, 3);
    });

    it('includes non-zero size for directories', function() {
      var binding = new Binding(system);
      var stats = binding.stat('mock-dir');
      assert.isNumber(stats.size);
      assert.isTrue(stats.size > 0);
    });

  });

  describe('#fstat()', function() {

    it('calls callback with a Stats instance', function(done) {
      var binding = new Binding(system);
      var fd = binding.open(path.join('mock-dir', 'one.txt'), flags('r'));
      binding.fstat(fd, function(err, stats) {
        if (err) {
          return done(err);
        }
        assert.instanceOf(stats, binding.Stats);
        done();
      });
    });

    it('returns a Stats instance when called synchronously', function() {
      var binding = new Binding(system);
      var fd = binding.open(path.join('mock-dir', 'one.txt'), flags('r'));
      var stats = binding.fstat(fd);
      assert.instanceOf(stats, binding.Stats);
    });

    it('identifies files (async)', function(done) {
      var binding = new Binding(system);
      var fd = binding.open(path.join('mock-dir', 'one.txt'), flags('r'));
      binding.fstat(fd, function(err, stats) {
        if (err) {
          return done(err);
        }
        assert.equal(stats.mode & constants.S_IFMT, constants.S_IFREG);
        done();
      });
    });

    it('identifies directories (async)', function(done) {
      var binding = new Binding(system);
      var fd = binding.open('mock-dir', flags('r'));
      binding.fstat(fd, function(err, stats) {
        if (err) {
          return done(err);
        }
        assert.equal(stats.mode & constants.S_IFMT, constants.S_IFDIR);
        done();
      });
    });


    it('includes size in bytes (async)', function(done) {
      var binding = new Binding(system);
      var fd = binding.open(path.join('mock-dir', 'two.txt'), flags('r'));
      binding.fstat(fd, function(err, stats) {
        if (err) {
          return done(err);
        }
        assert.equal(stats.size, 11);
        done();
      });
    });

    it('includes size in bytes (sync)', function() {
      var binding = new Binding(system);
      var fd = binding.open(path.join('mock-dir', 'three.bin'), flags('r'));
      var stats = binding.fstat(fd);
      assert.equal(stats.size, 3);
    });

    it('includes non-zero size for directories', function() {
      var binding = new Binding(system);
      var fd = binding.open('mock-dir', flags('r'));
      var stats = binding.fstat(fd);
      assert.isNumber(stats.size);
      assert.isTrue(stats.size > 0);
    });

  });

  describe('#readdir()', function() {

    it('calls callback with file list', function(done) {
      var binding = new Binding(system);
      binding.readdir('mock-dir', function(err, items) {
        assert.isNull(err);
        assert.isArray(items);
        assert.deepEqual(
            items.sort(), ['empty', 'one.txt', 'three.bin', 'two.txt']);
        done();
      });
    });

    it('returns a file list (sync)', function() {
      var binding = new Binding(system);
      var items = binding.readdir('mock-dir');
      assert.isArray(items);
      assert.deepEqual(
          items.sort(), ['empty', 'one.txt', 'three.bin', 'two.txt']);
    });

    it('calls callback with error for bogus dir', function(done) {
      var binding = new Binding(system);
      binding.readdir('bogus', function(err, items) {
        assert.instanceOf(err, Error);
        assert.isUndefined(items);
        done();
      });
    });

    it('calls callback with error for file path', function(done) {
      var binding = new Binding(system);
      binding.readdir(path.join('mock-dir', 'one.txt'), function(err, items) {
        assert.instanceOf(err, Error);
        assert.isUndefined(items);
        done();
      });
    });

  });

  describe('#open()', function() {

    it('creates a file descriptor for reading (r)', function() {
      var binding = new Binding(system);
      var fd = binding.open(path.join('mock-dir', 'one.txt'), flags('r'));
      assert.isNumber(fd);
    });

    it('generates error if file does not exist (r)', function() {
      var binding = new Binding(system);
      assert.throws(function() {
        binding.open('bogus', flags('r'));
      });
    });

    it('creates a file descriptor for reading and writing (r+)', function() {
      var binding = new Binding(system);
      var fd = binding.open(path.join('mock-dir', 'one.txt'), flags('r+'));
      assert.isNumber(fd);
    });

    it('does not truncate (r+)', function() {
      var binding = new Binding(system);
      var fd = binding.open(path.join('mock-dir', 'two.txt'), flags('r+'));
      var file = system.getItem(path.join('mock-dir', 'two.txt'));
      assert.instanceOf(file, File);
      assert.equal(String(file.getContent()), 'two content');
    });

    it('generates error if file does not exist (r+)', function() {
      var binding = new Binding(system);
      assert.throws(function() {
        binding.open('bogus', flags('r+'));
      });
    });

    it('creates a file descriptor for reading (rs)', function() {
      var binding = new Binding(system);
      var fd = binding.open(path.join('mock-dir', 'two.txt'), flags('rs'));
      assert.isNumber(fd);
    });

    it('generates error if file does not exist (rs)', function() {
      var binding = new Binding(system);
      assert.throws(function() {
        binding.open('bogus', flags('rs'));
      });
    });

    it('creates a file descriptor for reading and writing (rs+)', function() {
      var binding = new Binding(system);
      var fd = binding.open(path.join('mock-dir', 'two.txt'), flags('rs+'));
      assert.isNumber(fd);
    });

    it('generates error if file does not exist (rs+)', function() {
      var binding = new Binding(system);
      assert.throws(function() {
        binding.open('bogus', flags('rs+'));
      });
    });

    it('opens a new file for writing (w)', function() {
      var binding = new Binding(system);
      var fd = binding.open('new.txt', flags('w'), 0644);
      var file = system.getItem('new.txt');
      assert.instanceOf(file, File);
      assert.equal(file.getMode(), 0644);
    });

    it('truncates an existing file for writing (w)', function() {
      var binding = new Binding(system);
      var fd = binding.open(path.join('mock-dir', 'two.txt'), flags('w'), 0666);
      var file = system.getItem(path.join('mock-dir', 'two.txt'));
      assert.instanceOf(file, File);
      assert.equal(String(file.getContent()), '');
    });

    it('generates error if file exists (wx)', function() {
      var binding = new Binding(system);
      assert.throws(function() {
        binding.open(path.join('mock-dir', 'two.txt'), flags('wx'));
      });
    });

    it('opens a new file for reading and writing (w+)', function() {
      var binding = new Binding(system);
      var fd = binding.open('new.txt', flags('w+'), 0644);
      var file = system.getItem('new.txt');
      assert.instanceOf(file, File);
      assert.equal(file.getMode(), 0644);
      assert.equal(String(file.getContent()), '');
    });

    it('truncates an existing file for writing (w+)', function() {
      var binding = new Binding(system);
      var fd = binding.open(
          path.join('mock-dir', 'one.txt'), flags('w+'), 0666);
      var file = system.getItem(path.join('mock-dir', 'one.txt'));
      assert.instanceOf(file, File);
      assert.equal(String(file.getContent()), '');
    });

    it('opens a new file for reading and writing (wx+)', function() {
      var binding = new Binding(system);
      var fd = binding.open('new.txt', flags('wx+'), 0644);
      var file = system.getItem('new.txt');
      assert.instanceOf(file, File);
      assert.equal(file.getMode(), 0644);
      assert.equal(String(file.getContent()), '');
    });

    it('generates error if file exists (wx+)', function() {
      var binding = new Binding(system);
      assert.throws(function() {
        binding.open(path.join('mock-dir', 'one.txt'), flags('wx+'), 0666);
      });
    });

    it('opens a new file for appending (a)', function() {
      var binding = new Binding(system);
      var fd = binding.open('new.txt', flags('a'), 0666);
      var file = system.getItem('new.txt');
      assert.instanceOf(file, File);
      assert.equal(file.getMode(), 0666);
      assert.equal(String(file.getContent()), '');
    });

    it('opens an existing file for appending (a)', function() {
      var binding = new Binding(system);
      var fd = binding.open(
          path.join('mock-dir', 'one.txt'), flags('a'), 0666);
      var file = system.getItem(path.join('mock-dir', 'one.txt'));
      assert.instanceOf(file, File);
      assert.equal(String(file.getContent()), 'one content');
    });

    it('opens a new file for appending (ax)', function() {
      var binding = new Binding(system);
      var fd = binding.open('new.txt', flags('ax'), 0664);
      var file = system.getItem('new.txt');
      assert.instanceOf(file, File);
      assert.equal(file.getMode(), 0664);
      assert.equal(String(file.getContent()), '');
    });

    it('generates error if file exists (ax)', function() {
      var binding = new Binding(system);
      assert.throws(function() {
        binding.open(path.join('mock-dir', 'one.txt'), flags('ax'), 0666);
      });
    });

    it('opens a new file for appending and reading (a+)', function() {
      var binding = new Binding(system);
      var fd = binding.open('new.txt', flags('a+'), 0666);
      var file = system.getItem('new.txt');
      assert.instanceOf(file, File);
      assert.equal(file.getMode(), 0666);
      assert.equal(String(file.getContent()), '');
    });

    it('opens an existing file for appending and reading (a+)', function() {
      var binding = new Binding(system);
      var fd = binding.open(
          path.join('mock-dir', 'one.txt'), flags('a+'), 0666);
      var file = system.getItem(path.join('mock-dir', 'two.txt'));
      assert.instanceOf(file, File);
      assert.equal(String(file.getContent()), 'two content');
    });

    it('opens a new file for appending and reading (ax+)', function() {
      var binding = new Binding(system);
      var fd = binding.open('new.txt', flags('ax+'), 0666);
      var file = system.getItem('new.txt');
      assert.instanceOf(file, File);
      assert.equal(file.getMode(), 0666);
      assert.equal(String(file.getContent()), '');
    });

    it('opens an existing file for appending and reading (ax+)', function() {
      var binding = new Binding(system);
      assert.throws(function() {
        binding.open(path.join('mock-dir', 'two.txt'), flags('ax+'), 0666);
      });
    });

  });

  describe('#close()', function() {

    it('closes an existing file descriptor', function() {
      var binding = new Binding(system);
      var fd = binding.open('new.txt', flags('w'), 0644);
      binding.close(fd);
    });

    it('fails for closed file descriptor', function() {
      var binding = new Binding(system);
      var fd = binding.open('new.txt', flags('w'), 0644);
      binding.close(fd);
      assert.throws(function() {
        binding.close(fd);
      });
    });

  });

  describe('#read()', function() {

    it('reads from a file', function() {
      var binding = new Binding(system);
      var fd = binding.open(path.join('mock-dir', 'two.txt'), flags('r'));
      var buffer = new Buffer(11);
      var read = binding.read(fd, buffer, 0, 11, 0);
      assert.equal(read, 11);
      assert.equal(String(buffer), 'two content');
    });

    it('interprets null position as current position', function() {
      var binding = new Binding(system);
      var fd = binding.open(path.join('mock-dir', 'one.txt'), flags('r'));
      var buffer = new Buffer(4);

      // chunk 1
      assert.equal(binding.read(fd, buffer, 0, 11, null), 4);
      assert.equal(String(buffer), 'one ');

      // chunk 2
      assert.equal(binding.read(fd, buffer, 0, 11, null), 4);
      assert.equal(String(buffer), 'cont');

      // chunk 3
      assert.equal(binding.read(fd, buffer, 0, 11, null), 3);
      assert.equal(String(buffer.slice(0, 3)), 'ent');

    });

    it('throws if not open for reading', function() {
      var binding = new Binding(system);
      var fd = binding.open(path.join('mock-dir', 'two.txt'), flags('w'));
      var buffer = new Buffer(11);
      assert.throws(function() {
        binding.read(fd, buffer, 0, 11, 0);
      });
    });

  });

  describe('#write()', function() {

    it('writes to a file', function() {
      var binding = new Binding(system);
      var fd = binding.open(path.join('mock-dir', 'new.txt'), flags('w'));
      var buffer = new Buffer('new content');
      var written = binding.write(fd, buffer, 0, 11, 0);
      assert.equal(written, 11);
      var file = system.getItem(path.join('mock-dir', 'new.txt'));
      assert.instanceOf(file, File);
      var content = file.getContent();
      assert.isTrue(Buffer.isBuffer(content));
      assert.equal(String(content), 'new content');
    });

    it('can overwrite a file', function() {
      var binding = new Binding(system);
      var fd = binding.open(path.join('mock-dir', 'one.txt'), flags('w'));
      var buffer = new Buffer('bingo');
      var written = binding.write(fd, buffer, 0, 5, null);
      assert.equal(written, 5);
      var file = system.getItem(path.join('mock-dir', 'one.txt'));
      assert.instanceOf(file, File);
      var content = file.getContent();
      assert.isTrue(Buffer.isBuffer(content));
      assert.equal(String(content), 'bingo');
    });

    it('can append to a file', function() {
      var binding = new Binding(system);
      var fd = binding.open(path.join('mock-dir', 'one.txt'), flags('a'));
      var buffer = new Buffer(' more');
      var written = binding.write(fd, buffer, 0, 5, null);
      assert.equal(written, 5);
      var file = system.getItem(path.join('mock-dir', 'one.txt'));
      assert.instanceOf(file, File);
      var content = file.getContent();
      assert.isTrue(Buffer.isBuffer(content));
      assert.equal(String(content), 'one content more');
    });

    it('can overwrite part of a file', function() {
      var binding = new Binding(system);
      var fd = binding.open(path.join('mock-dir', 'one.txt'), flags('a'));
      var buffer = new Buffer('new');
      var written = binding.write(fd, buffer, 0, 3, 0);
      assert.equal(written, 3);
      var file = system.getItem(path.join('mock-dir', 'one.txt'));
      assert.instanceOf(file, File);
      var content = file.getContent();
      assert.isTrue(Buffer.isBuffer(content));
      assert.equal(String(content), 'new content');
    });

    it('throws if not open for writing', function() {
      var binding = new Binding(system);
      var fd = binding.open(path.join('mock-dir', 'two.txt'), flags('r'));
      var buffer = new Buffer('some content');
      assert.throws(function() {
        binding.write(fd, buffer, 0, 12, 0);
      });
    });

  });

  describe('#rename()', function() {

    it('allows files to be renamed', function(done) {
      var binding = new Binding(system);
      var oldPath = path.join('mock-dir', 'one.txt');
      var newPath = path.join('mock-dir', 'empty', 'new.txt');
      binding.rename(oldPath, newPath, function(err) {
        var stats = binding.stat(newPath);
        assert.equal(stats.mode & constants.S_IFMT, constants.S_IFREG);
        assert.equal(stats.size, 11);
        done();
      });
    });

    it('allows files to be renamed (sync)', function() {
      var binding = new Binding(system);
      var oldPath = path.join('mock-dir', 'one.txt');
      var newPath = path.join('mock-dir', 'new.txt');
      binding.rename(oldPath, newPath);
      var stats = binding.stat(newPath);
      assert.equal(stats.mode & constants.S_IFMT, constants.S_IFREG);
      assert.equal(stats.size, 11);
    });

    it('replaces existing files (sync)', function() {
      var binding = new Binding(system);
      var oldPath = path.join('mock-dir', 'one.txt');
      var newPath = path.join('mock-dir', 'two.txt');
      binding.rename(oldPath, newPath);
      var stats = binding.stat(newPath);
      assert.equal(stats.mode & constants.S_IFMT, constants.S_IFREG);
      assert.equal(stats.size, 11);
    });

    it('allows directories to be renamed', function(done) {
      var binding = new Binding(system);
      var oldPath = path.join('mock-dir', 'empty');
      var newPath = path.join('mock-dir', 'new');
      binding.rename(oldPath, newPath, function(err) {
        var stats = binding.stat(newPath);
        assert.equal(stats.mode & constants.S_IFMT, constants.S_IFDIR);
        done();
      });
    });

    it('allows directories to be renamed (sync)', function() {
      var binding = new Binding(system);
      var oldPath = path.join('mock-dir');
      var newPath = path.join('new-dir');
      binding.rename(oldPath, newPath);
      var stats = binding.stat(newPath);
      assert.equal(stats.mode & constants.S_IFMT, constants.S_IFDIR);
      var items = binding.readdir(newPath);
      assert.isArray(items);
      assert.deepEqual(
          items.sort(), ['empty', 'one.txt', 'three.bin', 'two.txt']);
    });

    it('calls callback with error for bogus old path', function(done) {
      var binding = new Binding(system);
      var oldPath = path.join('mock-dir', 'bogus');
      var newPath = path.join('mock-dir', 'new');
      binding.rename(oldPath, newPath, function(err) {
        assert.instanceOf(err, Error);
        done();
      });
    });

    it('calls callback with error for file->dir rename', function(done) {
      var binding = new Binding(system);
      var oldPath = path.join('mock-dir', 'one.txt');
      var newPath = path.join('mock-dir', 'empty');
      binding.rename(oldPath, newPath, function(err) {
        assert.instanceOf(err, Error);
        done();
      });
    });

    it('calls callback with error for dir->file rename', function(done) {
      var binding = new Binding(system);
      var oldPath = path.join('mock-dir', 'one.txt');
      var newPath = path.join('mock-dir', 'empty');
      binding.rename(oldPath, newPath, function(err) {
        assert.instanceOf(err, Error);
        done();
      });
    });

  });

  describe('#mkdir()', function() {

    it('creates a new directory', function() {
      var binding = new Binding(system);
      var dirPath = path.join('mock-dir', 'foo');
      binding.mkdir(dirPath, 0755);
      var dir = system.getItem(dirPath);
      assert.instanceOf(dir, Directory);
      assert.equal(dir.getMode(), 0755);
    });

    it('fails if parent does not exist', function() {
      var binding = new Binding(system);
      var dirPath = path.join('bogus', 'path');
      assert.throws(function() {
        binding.mkdir(dirPath, 0755);
      });
    });

    it('fails if directory exists', function() {
      var binding = new Binding(system);
      var dirPath = 'mock-dir';
      assert.throws(function() {
        binding.mkdir(dirPath, 0755);
      });
    });

    it('fails if file exists', function() {
      var binding = new Binding(system);
      var dirPath = path.join('mock-dir', 'one.txt');
      assert.throws(function() {
        binding.mkdir(dirPath, 0755);
      });
    });

  });

  describe('#rmdir()', function() {

    it('removes an empty directory', function() {
      var binding = new Binding(system);
      var dirPath = path.join('mock-dir', 'empty');
      binding.rmdir(dirPath);
      assert.isNull(system.getItem(dirPath));
    });

    it('fails if directory is not empty', function() {
      var binding = new Binding(system);
      var dirPath = 'mock-dir';
      assert.throws(function() {
        binding.rmdir(dirPath);
      });
    });

    it('fails if directory does not exist', function() {
      var binding = new Binding(system);
      var dirPath = path.join('bogus', 'path');
      assert.throws(function() {
        binding.rmdir(dirPath);
      });
    });

    it('fails if a file exists', function() {
      var binding = new Binding(system);
      var dirPath = path.join('mock-dir', 'one.txt');
      assert.throws(function() {
        binding.rmdir(dirPath);
      });
    });

  });

});
