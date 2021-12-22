# insta-like-swiper-pagination

## これは何？

[Swiper.js](https://swiperjs.com/ "Swiper - The Most Modern Mobile Touch Slider")のページネーションをInstagram風の動きにするライブラリです。

## Demo

https://shimabox.github.io/insta-like-swiper-pagination/

## 使い方

```js
<script src="https://unpkg.com/swiper/swiper-bundle.min.js"></script>
<script src="./js/InstaLikeSwiperPagination.js"></script>
<script>
  // Make pager instance.
  const pagination = new InstaLikeSwiperPagination();

  // Make Swiper.
  new Swiper('.my-swiper', {
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
      type: 'custom',
      renderCustom: function (swiper, current, total) {
        return pagination.render(swiper.slides, current, total);
      }
    }
  });
</script>
```

※ 詳しい使い方はTODOです

## TODO

* [ ] ページが動いたときにアニメーションが必要
  * ページが変わった感がない
* [ ] READMEをもう少しちゃんと書く
* [ ] cssがちょっと適当すぎる
* [ ] 処理のカスタムが行えるようにオプションを渡せる機構を用意する
* [ ] 簡易でもいいのでテスト書く

## Blog

- [Swiper.jsのページネーションをInstagram風にする – Shimabox Blog](https://blog.shimabox.net/2021/12/22/made_swiperjs_pagination_to_look_like_instagram/ "Swiper.jsのページネーションをInstagram風にする – Shimabox Blog")
  - ここに実装の元となったロジックなどを書いています

## License
The MIT License (MIT). Please see [License File](LICENSE) for more information.