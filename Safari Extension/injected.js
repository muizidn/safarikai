// Generated by CoffeeScript 1.11.1
(function() {
  var Client, client,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  Client = (function() {
    function Client(doc, window1) {
      this.doc = doc;
      this.window = window1;
      this.clientX = 0;
      this.clientY = 0;
      this.popupTagId = "safarikai-popup";
      this.enabled = true;
      this.mouseDown = false;
      this.highlighted = false;
      this.highlightText = true;
      this.showRomaji = true;
      this.showTranslation = true;
      this.rangeOffset = 0;
      this.doc.onmousemove = (function(_this) {
        return function(e) {
          var ref;
          if (!(_this.enabled && !_this.mouseDown)) {
            _this.hidePopup();
          } else {
            _this.createRange(e);
            if (((ref = _this.selectionText) != null ? ref.length : void 0) > 0) {
              safari.extension.dispatchMessage("lookupWord", {
                word: _this.selectionText,
                url: _this.window.location.href
              });
            } else {
              _this.clearHighlight();
              _this.hidePopup();
            }
          }
          return true;
        };
      })(this);
      this.doc.onmouseout = (function(_this) {
        return function(e) {
          return _this.hidePopup();
        };
      })(this);
      this.doc.onmousedown = (function(_this) {
        return function(e) {
          if (e.button === 0) {
            _this.mouseDown = true;
            _this.clearHighlight();
          }
          return true;
        };
      })(this);
      this.doc.onmouseup = (function(_this) {
        return function(e) {
          if (e.button === 0) {
            _this.mouseDown = false;
          }
          return true;
        };
      })(this);
      safari.self.addEventListener("message", (function(_this) {
        return function(e) {
          var messageData;
          messageData = e.message;
          switch (e.name) {
            case "showResult":
              return _this.showResult(messageData.word, messageData.url, messageData.result);
            case "status":
              return _this.updateStatus(messageData);
          }
        };
      })(this));
      safari.extension.dispatchMessage("queryStatus");
    }

    Client.prototype.createRange = function(e) {
      var container, ele, offset, range, ref, ref1, ref2, text;
      this.clientX = e.clientX;
      this.clientY = e.clientY;
      ele = this.doc.elementFromPoint(this.clientX, this.clientY);
      this.range = null;
      if (ref = ele.tagName, indexOf.call(this._ignoreElements, ref) >= 0) {
        return this.selectionText = "";
      } else if (ele.tagName === "IMG") {
        return this.selectionText = ele.alt.trim();
      } else {
        range = this.doc.caretRangeFromPoint(this.clientX, this.clientY);
        container = range.startContainer;
        offset = range.startOffset;
        if (offset === ((ref1 = container.data) != null ? ref1.length : void 0)) {
          if (this._isInlineNode(e.target) && container.parentNode.innerText !== e.target.innerText) {
            container = e.target.firstChild;
            offset = 0;
          }
        }
        range.setStart(container, offset);
        range.setEnd(container, Math.min((ref2 = container.data) != null ? ref2.length : void 0, offset + 12));
        text = range.toString();
        if (text !== this.selectionText) {
          this.range = range;
          this.rangeOffset = offset;
          return this.selectionText = text;
        }
      }
    };

    Client.prototype.highlight = function(word) {
      var container, ref, sel;
      if (!(this.highlightText && this.range)) {
        return;
      }
      if (this.mouseDown) {
        return;
      }
      sel = this.doc.defaultView.getSelection();
      if (!this.highlighted && sel.toString().length > 0) {
        return;
      }
      sel.removeAllRanges();
      if (this.range) {
        container = this.range.startContainer;
        this.range.setEnd(container, Math.min((ref = container.data) != null ? ref.length : void 0, this.rangeOffset + word.length));
        sel.addRange(this.range);
      }
      return this.highlighted = true;
    };

    Client.prototype.clearHighlight = function() {
      var sel;
      if (!this.highlightText) {
        return;
      }
      if (this.highlighted) {
        sel = this.doc.defaultView.getSelection();
        sel.removeAllRanges();
        return this.highlighted = false;
      }
    };

    Client.prototype.getPopup = function() {
      return this.doc.getElementById(this.popupTagId);
    };

    Client.prototype.injectPopup = function() {
      var popup;
      if (this.getPopup()) {
        return;
      }
      popup = this.doc.createElement("div");
      popup.id = "safarikai-popup";
      return this.doc.body.appendChild(popup);
    };

    Client.prototype.hidePopup = function() {
      var ref;
      return (ref = this.getPopup()) != null ? ref.style.display = "none" : void 0;
    };

    Client.prototype.decorateRow = function(row) {
      var kanji;
      kanji = row.kanji !== row.kana ? row.kanji : "";
      return "<li>\n  <div class='kana'>" + row.kana + "</div>\n  " + (kanji.length > 0 ? "<div class='kanji'>" + kanji + "</div>" : "") + "\n  " + (this.showRomaji || this.showTranslation ? "<div class='translation'>" : "") + "\n    " + (this.showRomaji ? "<div class='romaji'>[" + row.romaji + "]</div>" : "") + "\n    " + (this.showTranslation ? "" + row.translation : "") + "\n  " + (this.showRomaji || this.showTranslation ? "</div>" : "") + "\n</li>";
    };

    Client.prototype.showResult = function(word, url, result) {
      var htmlRows, left, margin, overflowX, popup, row, top;
      console.log("---");
      console.log("Result for " + word);
      console.log(result);
      if (this.window.location.href !== url) {
        return;
      }
      this.injectPopup();
      popup = this.getPopup();
      popup.style.display = "block";
      if (result.length === 0) {
        this.clearHighlight();
        return this.hidePopup();
      } else {
        this.highlight(word);
        htmlRows = (function() {
          var i, len, results;
          results = [];
          for (i = 0, len = result.length; i < len; i++) {
            row = result[i];
            results.push(this.decorateRow(row));
          }
          return results;
        }).call(this);
        popup.innerHTML = "<ul class='results'>" + (htmlRows.join('')) + "</ul>";
        popup.style.maxWidth = this.window.innerWidth < 400 ? "80%" : "500px";
        left = this.clientX + this.window.scrollX;
        overflowX = this.clientX + popup.offsetWidth - this.window.innerWidth + 10;
        if (overflowX > 0) {
          left -= overflowX;
        }
        popup.style.left = left + "px";
        margin = 30;
        top = this.clientY + this.window.scrollY + margin;
        if (this.clientY > this.window.innerHeight / 2) {
          top = this.clientY + this.window.scrollY - popup.offsetHeight - margin;
        }
        return popup.style.top = top + "px";
      }
    };

    Client.prototype.updateStatus = function(status) {
      this.enabled = status.enabled;
      this.highlightText = status.highlightText;
      this.showRomaji = status.showRomaji;
      this.showTranslation = status.showTranslation;
      if (!this.enabled) {
        return this.hidePopup();
      }
    };

    Client.prototype._isInlineNode = function(node) {
      var display;
      if (node.nodeName === "#text") {
        return true;
      }
      display = this.doc.defaultView.getComputedStyle(node, null).getPropertyValue("display");
      return display === "inline" || display === "inline-block";
    };

    Client.prototype._ignoreElements = ["TEXTAREA", "INPUT"];

    return Client;

  })();

  client = new Client(document, window);

}).call(this);
