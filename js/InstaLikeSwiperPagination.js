class InstaLikeSwiperPagination {
  constructor() {
    // 通常ドット最大表示数
    this._defineProperty('NUMBER_OF_NORMAL_PAGE_DOTS_TO_DISPLAY', 5);
    // 次へドット最大表示数
    this._defineProperty('NUMBER_OF_NEXT_PAGE_DOTS_TO_DISPLAY', 2);
    // 次への移動での描画変更を通知する閾値
    this._defineProperty(
      'THRESHOLD_FOR_NOTIFYING_DRAWING_CHANGE_ON_NEXT_MOVE',
      this.NUMBER_OF_NORMAL_PAGE_DOTS_TO_DISPLAY
    );
    // 前への移動での描画変更を通知する閾値
    this._defineProperty(
      'THRESHOLD_FOR_NOTIFYING_DRAWING_CHANGE_ON_PREV_MOVE',
      -this.NUMBER_OF_NORMAL_PAGE_DOTS_TO_DISPLAY
    );

    this._oldPage = 1;

    this._displayStartPage = 0;
    this._displayEndPage = 0;

    this._numberOfMovesToNext = 0;
    this._numberOfMovesToPrev = -this.NUMBER_OF_NORMAL_PAGE_DOTS_TO_DISPLAY;

    this._structureForRender = new Map();

    this._normalPageClassName = 'swiper-pagination-bullet';
    this._activePageClassName = 'swiper-pagination-bullet-active';
    this._prevPageClassName = 'swiper-pagination-prev-bullet';
    this._lastPrevPageClassName = 'swiper-pagination-last-prev-bullet';
    this._nextPageClassName = 'swiper-pagination-next-bullet';
    this._lastNextPageClassName = 'swiper-pagination-last-next-bullet';
  }

  /**
   * ページネーション用HTML作成
   * @param  {Array.<HTMLDivElement>} slides page要素
   * @param  {int} current カレントページ
   * @param  {int} total スライド対象総数
   * @return {string}
   */
  render = (slides, current, total) => {
    this._initializeStructureForRender(total);

    if (this._isTotalNumberOfPagesWithinRangeOfNormalDots(total)) {
      return this._render(
        slides,
        current,
        this._getDisplayStartPage(current),
        this.NUMBER_OF_NORMAL_PAGE_DOTS_TO_DISPLAY
      );
    }

    let isMoveToNextPages = false;
    let prevPageCount = 0;

    if (this._isMoveToNextPage(current)) {
      isMoveToNextPages = true;
      this._processingWhenMoveToNextPage(current);
      prevPageCount = this._getPrevPageCountWhenMoveToNext(current);
    } else {
      this._processingWhenMoveToPrevPage(current);
      prevPageCount = this._getPrevPageCountWhenMoveToPrev(current);
    }

    if (this._displayStartPage === 0) {
      this._displayStartPage = this._getDisplayStartPage(current);
    }
    if (this._displayEndPage === 0) {
      this._displayEndPage = this._getDisplayEndPage(prevPageCount, this._displayStartPage, total);
    }

    if (!this._necessaryDrawingChange()) {
      return this._render(
        slides,
        current,
        this._displayStartPage,
        this._displayEndPage
      );
    }

    let prevPageStructureForRenderer = [];
    if (isMoveToNextPages) {
      this._displayStartPage = this._getDisplayStartPage(current);
      this._displayEndPage = this._getDisplayEndPage(prevPageCount, this._displayStartPage, total);
      prevPageStructureForRenderer = this._createPrevPageStructureWhenMoveToNext(current, this._displayStartPage);
    } else {
      this._displayStartPage = this._getDisplayStartPageWhenMoveToPrev(current, prevPageCount);
      this._displayEndPage = this._getDisplayEndPage(prevPageCount, this._displayStartPage, total);
      prevPageStructureForRenderer = this._createPrevPageStructureWhenMoveToPrev(current, this._displayStartPage);
    }

    const nextPageCount = this._getNextPageCount(prevPageCount, this._displayStartPage, this._displayEndPage);
    const nextPageStructureForRenderer = this._createNextPageStructure(nextPageCount, this._displayEndPage);

    this._resetStructureForRender(total);
    this._updateStructureForRender(
      prevPageStructureForRenderer.concat(nextPageStructureForRenderer)
    );

    return this._render(
      slides,
      current,
      this._displayStartPage,
      this._displayEndPage
    );
  }

  /**
   * 描画用構造体の初期化
   * @param {int} total スライド対象総数
   */
  _initializeStructureForRender = (total) => {
    if (this._structureForRender.size > 0) {
      return;
    }

    for (let i=1;i<=total;i++) {
      this._structureForRender.set(i, this._createStructureForRender(i));
    }
  }

  /**
   * ページ総数が通常ドット最大表示数の範囲内か
   * @param  {int} total スライド対象総数
   * @return {boolean}
   */
  _isTotalNumberOfPagesWithinRangeOfNormalDots = (total) => {
    return total <= this.NUMBER_OF_NORMAL_PAGE_DOTS_TO_DISPLAY;
  }

  /**
   * 表示開始ページを返す
   * @param {int} current カレントページ
   * @return {int}
   */
  _getDisplayStartPage = (current) => {
    const max = this.NUMBER_OF_NORMAL_PAGE_DOTS_TO_DISPLAY + this.NUMBER_OF_NEXT_PAGE_DOTS_TO_DISPLAY;
    const startPage = (current + 1) - max;
    if (startPage <= 1) {
      return 1;
    }
    return startPage;
  }

  /**
   * 前に移動している場合の表示開始ページを返す
   * @param {int} current カレントページ
   * @param {int} prevPageCount 標準ドットの前に表示する前ページに戻るドットの数
   * @return {int}
   */
  _getDisplayStartPageWhenMoveToPrev = (current, prevPageCount) => {
    return current - prevPageCount;
  }

  /**
   * 表示終了ページを返す
   * @param {int} prevPageCount 標準ドットの前に表示する前ページに戻るドットの数
   * @param {int} displayStartPage 表示開始ページ
   * @param {int} total スライド対象総数
   * @return {int}
   */
  _getDisplayEndPage = (prevPageCount, displayStartPage, total) => {
    const page = this._getLargestNumberOfPreviousPageDots(prevPageCount, displayStartPage)
               + this.NUMBER_OF_NORMAL_PAGE_DOTS_TO_DISPLAY
               + this.NUMBER_OF_NEXT_PAGE_DOTS_TO_DISPLAY;

    if (page > total) {
      return total;
    }
    return page;
  }

  /**
   * 次のページに進んだか
   * @param {int} current
   * @return {boolean}
   */
  _isMoveToNextPage = (current) => {
    return current >= this._oldPage;
  }

  /**
   * 次へ移動した場合の処理
   * - 次への移動回数を取得して次への移動回数を取得して保持
   *   - 前回保持しておいた次への移動回数に加えて保持する
   *   - 通常ドット最大表示数を超えたら通常ドット最大表示数にまるめておく
   * - 前への移動回数に次への移動回数をプラスする
   *   - 前への移動回数が0以上になった場合0にまるめておく
   * @param {int} current
   */
  _processingWhenMoveToNextPage = (current) => {
    // 次への移動回数を取得して保持
    const numberOfMovesToNext = this._getNumberOfMovesToNext(current);
    if ((this._numberOfMovesToNext + numberOfMovesToNext) > this.NUMBER_OF_NORMAL_PAGE_DOTS_TO_DISPLAY) {
      this._numberOfMovesToNext = this.NUMBER_OF_NORMAL_PAGE_DOTS_TO_DISPLAY;
    } else {
      this._numberOfMovesToNext += numberOfMovesToNext;
    }

    // 前への移動回数に次への移動回数をプラスする
    if (this._numberOfMovesToPrev + numberOfMovesToNext > 0) {
      this._numberOfMovesToPrev = 0;
    } else {
      this._numberOfMovesToPrev += numberOfMovesToNext;
    }
  }

  /**
   * 前へ移動した場合の処理
   * - 前への移動回数を取得して保持
   *   - 前回保持しておいた前への移動回数から減算して保持する
   *   - (通常ドット最大表示数 * -1)より小さくなれば(通常ドット最大表示数 * -1)にまるめておく
   * - 次への移動回数から前への移動回数をマイナスする
   *   - 次への移動回数が0以下になった場合0にまるめておく
   * @param {int} current
   */
  _processingWhenMoveToPrevPage = (current) => {
    // 前への移動回数を取得して保持
    let numberOfMovesToPrev = this._getNumberOfMovesToPrev(current);
    const bases = this.NUMBER_OF_NORMAL_PAGE_DOTS_TO_DISPLAY * -1;
    if (this._numberOfMovesToPrev - numberOfMovesToPrev < bases) {
      this._numberOfMovesToPrev = bases;
    } else {
      this._numberOfMovesToPrev -= numberOfMovesToPrev;
    }

    // 次への移動回数から前への移動回数をマイナスする
    if (this._numberOfMovesToNext - numberOfMovesToPrev < 0) {
      this._numberOfMovesToNext = 0;
    } else {
      this._numberOfMovesToNext -= numberOfMovesToPrev;
    }
  }

  /**
   * 描画を変更する必要があるか
   * @return {boolean}
   */
  _necessaryDrawingChange = () => {
    if (
      this._numberOfMovesToNext >= this.THRESHOLD_FOR_NOTIFYING_DRAWING_CHANGE_ON_NEXT_MOVE
      || this._numberOfMovesToPrev <= this.THRESHOLD_FOR_NOTIFYING_DRAWING_CHANGE_ON_PREV_MOVE
    ) {
      return true;
    }
    return false;
  }

  /**
   * 次へ移動している場合の前へのページドット構造の数
   * @param {int} current カレントページ
   * @return {int}
   */
  _getPrevPageCountWhenMoveToNext = (current) => {
    if (!this._necessaryDrawingChange()) {
      return 0;
    }

    if (current - 1 < this.NUMBER_OF_NORMAL_PAGE_DOTS_TO_DISPLAY) {
      return 0;
    }

    if (current - 1 === this.NUMBER_OF_NORMAL_PAGE_DOTS_TO_DISPLAY) {
      return 1;
    }

    return 2;
  }

  /**
   * 前へ移動している場合の前へのページドット構造の数
   * @param {int} current カレントページ
   * @return {int}
   */
  _getPrevPageCountWhenMoveToPrev = (current) => {
    if (!this._necessaryDrawingChange()) {
      return 0;
    }

    if (current === 1) {
      return 0;
    }

    if (current === 2) {
      return 1;
    }

    return 2;
  }

  /**
   * 次へ移動している場合の前へのページドット構造を作成する
   * @param {int} current カレントページ
   * @param {int} displayStartPage 表示開始ページ
   * @return {Array<Object>}
   */
  _createPrevPageStructureWhenMoveToNext = (current, displayStartPage) => {
    if (current - 1 < this.NUMBER_OF_NORMAL_PAGE_DOTS_TO_DISPLAY) {
      return [];
    }

    if (current - 1 === this.NUMBER_OF_NORMAL_PAGE_DOTS_TO_DISPLAY) {
      return [
        this._createStructureForRender(
          displayStartPage,
          this._prevPageClassName
        )
      ];
    }

    return [
      this._createStructureForRender(
        displayStartPage,
        this._lastPrevPageClassName
      ),
      this._createStructureForRender(
        displayStartPage + 1,
        this._prevPageClassName
      ),
    ];
  }

  /**
   * 前へ移動している場合の前へのページドット構造を作成する
   * @param {int} current カレントページ
   * @param {int} displayStartPage 表示開始ページ
   * @return {Array<Object>}
   */
  _createPrevPageStructureWhenMoveToPrev = (current, displayStartPage) => {
    if (current === 1) {
      return [];
    }

    if (current === 2) {
      return [
        this._createStructureForRender(
          displayStartPage,
          this._prevPageClassName
        )
      ];
    }

    return [
      this._createStructureForRender(
        displayStartPage,
        this._lastPrevPageClassName
      ),
      this._createStructureForRender(
        displayStartPage + 1,
        this._prevPageClassName
      ),
    ];
  }

  /**
   * 次へのページドット構造の数
   * @param {int} prevPageCount 標準ドットの前に表示する前ページに戻るドットの数
   * @param {int} displayStartPage 表示開始ページ
   * @param {int} displayEndPage 表示終了ページ
   * @return {int}
   */
  _getNextPageCount = (prevPageCount, displayStartPage, displayEndPage) => {
    // 前へのページドットの中で一番大きいページの数
    const largestNumberOfPreviousPageDots = this._getLargestNumberOfPreviousPageDots(prevPageCount, displayStartPage);
    // 前へのページドットの中で一番大きいページの数と基本ページドットの数を足す
    const totalCountOfPrevAndNormalDots = largestNumberOfPreviousPageDots + this.NUMBER_OF_NORMAL_PAGE_DOTS_TO_DISPLAY;
    // 表示終了ページから引いて次へのページドット構造の数を返す
    return displayEndPage - totalCountOfPrevAndNormalDots;
  }

  /**
   * 前へのページドットの中で一番大きいページの数を返す
   * 例) 前へのページドットの各ページが 2, 3 となっていれば3を返す
   * @param {int} prevPageCount prevPageCount 標準ドットの前に表示する前ページに戻るドットの数
   * @param {int} displayStartPage 表示開始ページ
   * @return {int}
   */
  _getLargestNumberOfPreviousPageDots = (prevPageCount, displayStartPage) => {
    return (prevPageCount - 1) + displayStartPage;
  }

  /**
   * 次へのページドット構造を作成する
   * @param {int} nextPageCount 次へのページドット構造の数
   * @param {int} displayEndPage 表示終了ページ
   * @return {Array<Object>}
   */
  _createNextPageStructure = (nextPageCount, displayEndPage) => {
    if (nextPageCount === 0) {
      return [];
    }

    if (nextPageCount === 1) {
      return [
        this._createStructureForRender(
          displayEndPage,
          this._nextPageClassName
        )
      ];
    }

    if (nextPageCount >= 2) {
      return [
        this._createStructureForRender(
          displayEndPage - 1,
          this._nextPageClassName
        ),
        this._createStructureForRender(
          displayEndPage,
          this._lastNextPageClassName
        )
      ];
    }
  }

  /**
   * 描画用構造体のリセット
   * @param {int} total スライド対象総数
   */
  _resetStructureForRender = (total) => {
    for (let i=1;i<=total;i++) {
      this._structureForRender.set(i, this._createStructureForRender(i));
    }
  }

  /**
   * 描画用構造体の作成
   * @param {int} page ページ
   * @param {string} addClassName ドットに付与するクラス名
   * @return Object
   */
  _createStructureForRender = (page, addClassName = '') => {
    let className = this._normalPageClassName;
    if (addClassName !== '') {
      className = `${className} ${addClassName}`;
    }
    return {
      'page': page,
      'className': className
    };
  }

  /**
   * 描画用構造体の更新
   * @param {Array<Object>} updateStructures
   */
  _updateStructureForRender = (updateStructures) => {
    updateStructures.forEach((updateStructure) => {
      let page = updateStructure.page;
      const structure = this._structureForRender.get(page);
      structure.className = updateStructure.className;
      this._structureForRender.set(page, structure);
    });
  }

  /**
   * ページネーション用HTML作成
   * @param  {Array.<HTMLDivElement>} slides page要素
   * @param  {int} current カレントページ
   * @param  {int} displayStartPage 表示開始ページ
   * @param  {int} displayEndPage 表示終了ページ
   * @return {string}
   */
  _render = (slides, current, displayStartPage, displayEndPage) => {
    let html = '';
    let className = '';
    slides.forEach((_, index) => {
      const page = index + 1;
      if (page < displayStartPage || page > displayEndPage) {
        html += '<span style="display:none;"></span>';
        return;
      }
      const structure = this._structureForRender.get(page);
      if (structure.page === current) {
        className = structure.className + ` ${this._activePageClassName}`;
      } else {
        className = structure.className;
      }
      html += `<span class="${className}"></span>`;
    });

    this._oldPage = current;

    return html;
  }

  /**
   * 次への移動回数を取得
   * @param {int} current
   * @return {int}
   */
  _getNumberOfMovesToNext = (current) => {
    return current - this._oldPage;
  }

  /**
   * 前への移動回数を取得
   * @param {int} current
   * @return {int}
   */
  _getNumberOfMovesToPrev = (current) => {
    return this._oldPage - current;
  }

  /**
   * 定数定義(readonlyなプロパティを作成)
   * @param {string} key
   * @param {*} val
   */
  _defineProperty = (key, val) => {
    Object.defineProperty(
      this,
      key,
      { value: val }
    );
  }

  __debug = (groupName='debug') => {
    console.group(groupName);
    let properties = [];
    Object.entries(this).forEach((props, _) => {
      if (typeof props[1] !== 'function') {
        properties.push({[props[0]] : props[1]});
      }
    });
    console.log(JSON.stringify([...properties], null, 2));
    console.log(JSON.stringify([...this._structureForRender], null, 2));
    console.groupEnd(groupName);
  }
}
