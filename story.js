"use strict";
/* ============ story.js ============ */
const LOCAL_EVENTS=[
 {id:"basho_sekihi",title:"松尾芭蕉の石碑",img:"yuki",fx:{aff:5,stress:-6},text:"町なかを歩いていたら、松尾芭蕉の石碑の前で{hero}と出会った。\n黒羽は芭蕉が長く滞在した町。句碑は、探すと町なかに点々とある。\n「この句、学校で習いましたよね。…本物の石で読むと、少し違って聞こえます」\n石に刻まれた文字を、二人で静かに読み比べた。"},
 {id:"ozeki_kinenhi",title:"大関和の記念碑",img:"rin",fx:{aff:5,stress:-5},text:"黒羽城址公園のそばで、大関和の記念碑の前に立つ{hero}と出会った。\n黒羽の歴史を語る彼女の話は、授業よりずっと面白かった。\n「この町のことを知ると、毎日歩く道の見え方が変わるのよ」\n帰り道、いつもの景色が少しだけ違って見えた。"},
 {id:"ungan_zazen",title:"雲巌寺の座禅体験",img:"rin",fx:{aff:4,stress:-14},text:"週末、雲巌寺の座禅体験に{hero}と参加した。\n凛とした空気の中、ただ座って呼吸を数える時間。\n「…不思議。頭の中が、すーっと静かになった」\n帰りの山道、二人とも少しだけ穏やかな顔になっていた。"},
 {id:"ungan_kouyou",title:"雲巌寺の紅葉",img:"yuki",months:[10,11],fx:{aff:6,stress:-8},text:"秋の雲巌寺へ、{hero}と紅葉を見に行った。\n赤く染まる山門と、静かな境内に、思わず声が小さくなる。\n「写真より、ずっと赤いですね…。目に焼き付けて帰りましょう」\n落ち葉を踏む音だけが、境内に響いていた。"},
 {id:"daioji",title:"大雄寺の静けさ",img:"yuki",fx:{aff:4,stress:-10},text:"放課後、大雄寺の境内で{hero}とばったり。\n歴史ある禅寺の静けさに、二人とも自然と小声になった。\n「ここに来ると、悩みが小さく思えるんです」\n夕日の境内は、時間がゆっくり流れていた。"},
 {id:"yana",title:"那珂川のやな場",img:"akari",months:[7,8,9],fx:{aff:6,stress:-7},text:"那珂川のやな場に、{hero}と鮎を見に行った。\n川をせき止めた「やな」に、鮎が次々とかかっていく。\n「見て見て！すごい量！これ全部、黒羽の恵みだね！」\n川の音と、鮎のはねる音。夏の黒羽の音だった。"},
 {id:"gohou",title:"五峰の湯の足湯",img:"sakura",fx:{aff:5,stress:-12},text:"黒羽温泉・五峰の湯の前を通りかかり、{hero}と足湯に浸かった。\n「はあ…気持ちいい。温泉まんじゅうも買っちゃおうか」\n湯気と笑い声で、疲れがほぐれていくのが分かった。\n帰る頃には、足取りが軽くなっていた。"},
 {id:"yoichi",title:"道の駅・那須与一の郷",img:"sakura",fx:{aff:5,stress:-6},text:"道の駅「那須与一の郷」に、{hero}と寄り道した。\n地元の野菜やお土産を眺めながら、あれこれ品定め。\n「与一さんって、大田原の英雄なんだよ。弓の名手だったんだって」\nソフトクリームを分け合って、のんびり帰った。"},
 {id:"nashi",title:"梨畑の前で",img:"akari",months:[9,10],fx:{aff:5,stress:-6},text:"大田原の梨畑の前を、{hero}と歩いた。\nたわわに実った梨が、秋の日差しに光っている。\n「今年の梨、甘いらしいよ！直売所、寄ってかない？」\n試食の梨は、シャキッと甘くて、秋の味がした。"},
 {id:"beef",title:"大田原牛の看板",img:"akari",fx:{aff:4,stress:-5},text:"大田原牛の店の前で、{hero}とショーケースに見入った。\n「うわあ…一切れで私のお小遣いが…」\nいつか絶対食べよう、と二人で誓い合った。\n夢は大きく、今日のところはコロッケで我慢した。"},
 {id:"togarashi",title:"とうがらし味噌",img:"sakura",fx:{aff:5,stress:-6},text:"{hero}の家で、大田原とうがらしの味噌を味見させてもらった。\n「辛いけど、クセになるでしょ？うちでは何にでも付けるんだ」\n舌がひりひりするのに、箸が止まらない。\n黒羽の食卓の味を、また一つ覚えた。"},
 {id:"library_seki",title:"黒羽図書館の窓際席",img:"yuki",fx:{aff:5,stress:-8},text:"黒羽図書館の窓際席で、{hero}と並んで本を読んだ。\n山みたいな形の建物の大きな窓から、那珂川と山並みが見える。\n「…この席、放課後の特等席なんです」\nページをめくる音だけの、贅沢な時間だった。"},
 {id:"joseki_bench",title:"城址公園のベンチ",img:"rin",fx:{aff:5,stress:-7},text:"黒羽城址公園のベンチで、{hero}と休憩した。\n城址の緑と、遠くの山々。町の音が、少し遠くに聞こえる。\n「ここから見る黒羽の町、私は好きだな」\n缶ジュース一本の時間が、意外と大事な時間になった。"},
 {id:"basho_yakata",title:"芭蕉の館の企画展",img:"yuki",fx:{aff:5,stress:-6},text:"黒羽芭蕉の館の企画展に、{hero}と行ってきた。\n芭蕉と黒羽の関わりをたどる展示に、二人とも見入ってしまった。\n「俳句って、五・七・五に全部を込めるんですよね…」\n帰り道、景色が少しだけ句の材料に見えた。"},
 {id:"kagetsu_mae",title:"ホテル花月の前で",img:"akari",fx:{aff:4,stress:-6},text:"ホテル花月の前で、部活帰りの{hero}と会った。\n「うちの部、今度の合宿も花月なんだ。ご飯が楽しみで！」\n町のホテルの明かりが、夕方の道を温かく照らしていた。\n他愛ない話をしながら、途中まで一緒に帰った。"},
 {id:"shotengai",title:"黒羽の商店街",img:"sakura",fx:{aff:5,stress:-6},text:"黒羽の商店街を、{hero}とぶらぶら歩いた。\n昔ながらの駄菓子屋で、二人して大人買いしてしまった。\n「こういうお店、ずっと残ってほしいよね」\n袋いっぱいの駄菓子と一緒に、夕日の道を帰った。"},
 {id:"taue",title:"田んぼの風景",img:"sakura",months:[5,6],fx:{aff:4,stress:-8},text:"那須野が原の田んぼのあぜ道を、{hero}と歩いた。\n水を張った田んぼに、空と山が映り込んでいる。\n「この景色の中で育ったんだなあ、私たち」\n蛙の声を聞きながら、のんびり帰った。"},
 {id:"hoshizora",title:"黒羽の星空",img:"yuki",fx:{aff:6,stress:-8},text:"少し遅くなった帰り道、{hero}と夜空を見上げた。\n町の明かりが少ない黒羽の空には、星が降るように瞬いている。\n「流れ星、探しちゃいますね…」\n二人とも、しばらく黙って空を見ていた。"},
 {id:"sosui",title:"那須疏水の話",img:"rin",fx:{aff:4,stress:-5},text:"帰り道、那須疏水の水路沿いを{hero}と歩いた。\n「この水が、那須野が原を潤してきたのよ」\n何気ない水路にも、町の歴史が流れている。\n教科書の中の話が、足元にあるのが不思議だった。"},
 {id:"illumi",title:"城址公園のイルミネーション",img:"rin",months:[12,1],fx:{aff:6,stress:-7},text:"冬の黒羽城址公園。イルミネーションが城址を彩っていた。\n冷たい空気の中、{hero}と光のトンネルを歩く。\n「寒いけど…来てよかったな」\n白い息と、色とりどりの光。冬の黒羽の夜だった。"},
 {id:"kaeru",title:"蛙の声の帰り道",img:"sakura",months:[6,7],fx:{aff:4,stress:-7},text:"夕方の帰り道、田んぼから大合唱の蛙の声。\n「芭蕉の『古池や』の蛙も、こんな声だったのかな」\n{hero}と顔を見合わせて笑った。\nうるさいはずの声が、今日は少し風流に聞こえた。"},
 {id:"gelato",title:"とうがらしジェラート対決",img:"sakura",months:[6,7,8],fx:{aff:5,stress:-6},text:"道の駅「那須与一の郷」で、名物のとうがらしジェラートに{hero}と挑戦した。\n栃木三鷹とうがらし入りの、甘くて辛い不思議な味。\n「ひーっ、辛い！…でも、後を引く…もう一口だけ！」\n二人で舌を出しながら笑い合った。黒羽の夏の味がした。"},
 {id:"ayu_shioyaki",title:"鮎の塩焼きと芭蕉定食",img:"akari",months:[7,8,9,10],fx:{aff:6,stress:-6},text:"黒羽観光やなで、鮎の塩焼きと芭蕉定食を{hero}と味わった。\n那珂川の鮎は漁獲量日本一。炭火で焼かれた鮎は、香ばしくてほろ苦い。\n「頭から丸ごといけるよ！これが黒羽の夏の味！」\n川の音を聞きながらの昼ごはんは、格別だった。"},
 {id:"ayu_tsukami",title:"鮎のつかみ取り",img:"akari",months:[7,8],fx:{aff:6,stress:-8},text:"やな場のつかみ取り体験で、{hero}と鮎を追いかけた。\nぬるりと逃げる鮎に、二人とも夢中になった。\n「捕った！…あ、逃げた！川の魚は手ごわいね！」\nずぶ濡れになって笑い合う、夏休みらしい午後だった。"},
 {id:"haiku",title:"芭蕉の館で俳句づくり",img:"yuki",fx:{aff:5,stress:-6},text:"黒羽芭蕉の館で、{hero}と俳句づくりに挑戦した。\n芭蕉が奥の細道で最長14日も滞在した町。館の人の添削は、意外と本格的だった。\n「五・七・五に収めるの、難しいですね…でも、景色が言葉になる感じがします」\n帰り道の景色が、少しだけ句の材料に見えた。"},
 {id:"ajisai",title:"くろばね紫陽花まつり",img:"sakura",months:[6,7],fx:{aff:6,stress:-7},text:"黒羽城址公園の紫陽花まつりに、{hero}と出かけた。\n約6,000株のあじさいが、城址の斜面を青や紫に染めていた。\n「雨上がりのあじさいって、宝石みたいだね」\n傘を差しながら歩く参道は、梅雨の憂鬱を忘れる美しさだった。"},
 {id:"ajisai_light",title:"紫陽花のライトアップ",img:"rin",months:[6],fx:{aff:7,stress:-6},text:"夜の黒羽城址公園。紫陽花まつりのライトアップに、{hero}と来た。\n闇に浮かぶあじさいと、静かな城址。昼とは違う、幻想的な世界だった。\n「…昼より、ずっと静かで、きれい。連れてきてくれて、ありがとう」\n帰るのが惜しいような夜だった。"},
 {id:"ajisai_sketch",title:"紫陽花スケッチ",img:"yuki",months:[6],fx:{aff:5,stress:-6},text:"城址公園で、{hero}と紫陽花のスケッチをした。\n花の色は一株ごとに微妙に違う。描くより、見る方がずっと難しかった。\n「色って、目で見るたびに変わるんですね…」\nスケッチブックの中のあじさいも、それなりに咲いた。"},
 {id:"daioji_saho",title:"大雄寺の作法教室",img:"rin",fx:{aff:5,stress:-9},text:"大雄寺の作法教室に、{hero}と参加した。\n茅葺きの本堂で、座り方、歩き方、お辞儀の仕方を習う。\n「背筋が伸びると、心まで整う気がしますね」\n凛とした空気の中、背筋の伸びる時間だった。"},
 {id:"ungan_bridge",title:"雲巌寺の赤い橋",img:"sakura",months:[10,11],fx:{aff:6,stress:-7},text:"雲巌寺の赤い橋で、{hero}と写真を撮り合った。\n紅葉と朱色の橋のコントラストが、絵はがきみたいにきれいだった。\n「ここ、時間が止まってるみたいだね」\n静かな山の空気に、二人とも声が小さくなった。"},
 {id:"mizuyuen",title:"なかがわ水遊園",img:"yuki",fx:{aff:5,stress:-7},text:"県立なかがわ水遊園の「おもしろ魚館」に、{hero}と行った。\n那珂川の淡水魚がずらり。鮎の群れが、水槽の中を銀色に泳いでいた。\n「川の中の世界って、こんなに賑やかなんですね…」\n雨の日でも楽しめる、黒羽の隠れスポットだった。"},
 {id:"yoichi_matsuri",title:"与一まつりの屋台巡り",img:"sakura",months:[8],fx:{aff:6,stress:-6},text:"大田原の与一まつり。目抜き通りが歩行者天国になり、屋台がずらりと並んでいた。\n{hero}と食べ歩きをしながら、那須与一を称える祭りの熱気に包まれた。\n「扇の的の与一さん、かっこいいよね！私も的に当てたい！」\n夏の夜の賑わいが、しばらく耳に残った。"},
 {id:"yoichi_taiko",title:"黒羽太鼓の音",img:"akari",months:[8],fx:{aff:5,stress:-6},text:"与一まつりの会場で、黒羽太鼓の演奏に{hero}と見入った。\n腹の底まで響く太鼓の音と、若い打ち手たちの掛け声。\n「太鼓の音って、心臓と一緒に鳴る感じがする！」\n祭りの夜、音はしばらく体に残った。"},
 {id:"ayutsuri",title:"鮎釣り大会の応援",img:"akari",months:[8],fx:{aff:6,stress:-6},text:"那珂川レディース鮎釣り大会の応援に、{hero}と行った。\n川に竿を並べる参加者たち。鮎がかかるたび、河原に歓声が上がった。\n「来年は私も出る！…まず、鮎と友達になるところからだね」\n川と人と鮎の、夏の風物詩だった。"},
 {id:"marathon_vol",title:"マラソンの給水ボランティア",img:"akari",months:[11],fx:{aff:6,stress:-5},text:"大田原マラソンの給水ボランティアに、{hero}と参加した。\n制限時間4時間のレース。走る人、支える人、応援する人で、町が一つになっていた。\n「走るのもいいけど、支える側も悪くないね！」\n紙コップを差し出す手が、少し誇らしかった。"},
 {id:"marathon_run",title:"大田原マラソンへの挑戦",img:"akari",months:[11],fx:{aff:5,stress:-4},text:"大田原マラソンの10kmの部に、{hero}と挑戦した。\n沿道の応援と、黒羽の秋の景色に背中を押されて、なんとか完走。\n「やった…ゴール！来年は、もっと速く走る！」\nゴール後の豚汁の味は、一生忘れられない味だった。"},
 {id:"sangyo_fes",title:"産業文化祭の模擬店",img:"sakura",months:[11],fx:{aff:6,stress:-5},text:"大田原市産業文化祭で、{hero}と模擬店を手伝った。\n県北体育館と美原公園に、町中の人が集まる大きな祭り。\n「いらっしゃいませー！…商売って、声を出すのが大事なんだね」\n売り上げを数える帰り道、二人とも少し大人になった気分だった。"},
 {id:"ja_matsuri",title:"JAまつりの詰め放題",img:"sakura",months:[11],fx:{aff:5,stress:-6},text:"産業文化祭と同時開催のJAまつりで、野菜の詰め放題に{hero}と挑んだ。\n袋いっぱいに詰めた大根、ネギ、里芋。地元の畑の恵みだ。\n「これで今週のご飯は安泰だね！煮物パーティーしよう！」\n重い袋を二人で分け合って帰った。"},
 {id:"kurohacha",title:"黒羽茶の試飲会",img:"rin",fx:{aff:5,stress:-8},text:"道の駅で、黒羽茶の試飲会に{hero}と参加した。\nお茶の産地の北限といわれる黒羽のお茶は、すっきりした甘みがあった。\n「紅茶とは違う、静かな香り…。日本のお茶も、奥が深いのね」\n急須の湯気と一緒に、ゆっくりした時間が流れた。"},
 {id:"togarashi_harvest",title:"栃木三鷹の収穫手伝い",img:"sakura",months:[9,10],fx:{aff:5,stress:-5},text:"とうがらし畑で、栃木三鷹の収穫を{hero}と手伝った。\n生産量日本一を宣言した大田原のとうがらし。真っ赤な実が、秋の日差しに光っていた。\n「手袋してても、目が…！でも、この赤、きれいだね」\nお礼にもらった乾燥とうがらしは、冬の鍋の主役になった。"},
 {id:"santakara",title:"さんたからあげ食べ歩き",img:"akari",fx:{aff:5,stress:-5},text:"商店街で、大田原ブランド「さんたからあげ」を{hero}と食べ歩いた。\nとうがらしの効いた唐揚げは、辛さと旨さのバランスが絶妙だった。\n「辛い！うまい！止まらない！これ考えた人、天才だね」\n手と口を真っ赤にしながら、二人で笑った。"},
 {id:"fukubiki",title:"商店街の歳末福引き",img:"rin",months:[12],fx:{aff:5,stress:-6},text:"年末の黒羽商店街で、歳末セールの福引きに{hero}と並んだ。\nガラガラと回る抽選器。結果は参加賞のポケットティッシュだったけれど――\n「こういう年末の感じ、嫌いじゃないわ」\n商店街の明かりが、いつもより温かく見えた。"},
 {id:"kurashi",title:"くらしの館の昔体験",img:"yuki",fx:{aff:5,stress:-7},text:"くらしの館で、昔の暮らしの展示を{hero}と見て回った。\n萱葺きの古民家、囲炉裏、昔の道具。手打ち蕎麦の匂いもした。\n「物語の舞台って、こういう場所だったんですね…」\n帰り道、二人とも少しだけ昔の人になった気分だった。"},
 {id:"yoichi_den",title:"那須与一伝承館",img:"yuki",fx:{aff:5,stress:-6},text:"道の駅の隣、那須与一伝承館に{hero}と寄った。\n屋島の戦いで扇の的を射た与一の物語が、資料と一緒に展示されていた。\n「離れた小船の扇を射るなんて…物語みたいな人が、本当にいたんですね」\n大田原の英雄の話は、思ったよりずっと面白かった。"},
 {id:"kofun",title:"下侍塚古墳の丘",img:"rin",fx:{aff:4,stress:-7},text:"少し足を延ばして、下侍塚古墳を{hero}と見に行った。\n緑の丘のように静かな古墳。はるか昔の人の営みに思いを馳せた。\n「この景色を、昔の人も見ていたのね…」\n那須の歴史の深さを感じる、小さな遠足だった。"}

];
const SECRET_EVENTS=[
 {id:"yana_master",title:"やなの大将",months:[7,8,9,10],img:"akari",text:"那珂川のやな場で、鮎を焼く大将と話し込んだ。\n日に焼けた腕と、60年鮎を見てきた目。塩焼きの極意は「鮎の機嫌を損ねないこと」だそうだ。\n「若いのが川を好きでいてくれると、鮎も喜ぶんだ」\n焼きたてを一匹、おまけでもらった。"},
 {id:"muscle",title:"ホームセンターの鉄人",img:"sakura",text:"ホームセンターで、ボディビルみたいなおっちゃんに声をかけられた。\n「兄ちゃん、この棚の奥のボルト、取ってくれねえか。…俺の腕じゃ、入らなくてよ」\nお礼に、筋肉と道具の熱い講義が始まった。\n「道具も筋肉も、手入れした分だけ応えてくれるんだ」妙に深い言葉だった。"},
 {id:"madam",title:"バイト先のマダム",img:"rin",text:"バイト先のカフェに、真珠のネックレスのお金持ちのマダムが来店した。\n「あら、学生さん？…いい目をしてるわ。夢は、値段のつけられないものよ」\n注文は一番高いケーキセット。帰り際、笑顔で大きなチップを置いていった。\nあの余裕は、どこから来るのだろう。"},
 {id:"mascot",title:"ゆるキャラ与一丸",img:"sakura",text:"商店街で、大田原のゆるキャラ「与一丸」が立ち往生していた。\n扇の的の被り物で視界が悪く、休憩所まで行けないらしい。手を引き、そっと案内した。\n中から聞こえた「ありがと〜…」という声は、思ったよりずっと若かった。\n町の人気者の裏側を、少しだけ知ってしまった。"},
 {id:"tougarashi_baachan",title:"とうがらし畑のおばあちゃん",img:"sakura",months:[9,10,11],text:"とうがらし畑の前で、農家のおばあちゃんに声をかけられた。\n「あんた、いい手つきだね。収穫、手伝ってかね？」\n栃木三鷹の収穫を手伝うと、お礼に自家製の漬物をもらった。\n「辛いのはね、冬の体を守るためだよ」おばあちゃんの知恵は、教科書より役に立った。"},
 {id:"curator",title:"芭蕉の館の学芸員",img:"yuki",text:"黒羽芭蕉の館で、学芸員さんが閉館間際に声をかけてくれた。\n「芭蕉さんも、最初は無名の旅人だったんですよ」\n特別に、収蔵庫の芭蕉直筆の写しを見せてもらえた。\n町の宝物を守る人の背中は、静かで、まっすぐだった。"}
];
const STORY={
sakura:[
 {min:35,title:"第1章 古い写真",scenes:[
  {who:"　",text:"放課後、さくらの教科書から、古い写真がはらりと落ちた。"},
  {hero:"sakura",who:"桜井 さくら",variant:"shy",text:"あ…！それ、返して…。…小さい頃の、私たちだね。桜の木の下の"},
  {who:"　",text:"色あせた写真の中で、幼い二人が手をつないで笑っていた。さくらはそれを、ずっと教科書に挟んでいたのだ。",choices:[
   {label:"「大事にしてくれてたんだね」",effect:()=>{S.aff.sakura=clamp(S.aff.sakura+6)}},
   {label:"「今も昔も変わらないね」",effect:()=>{S.aff.sakura=clamp(S.aff.sakura+3)}}]},
  {hero:"sakura",who:"桜井 さくら",variant:"shy",text:"…私にとっては、宝物なんだ。{call}が忘れてても、私は覚えてる。ずっとね"}]},
 {min:55,title:"第2章 幼なじみの距離",scenes:[
  {who:"　",text:"最近、さくらの様子がおかしい。話しかけても、どこか上の空だ。"},
  {hero:"sakura",who:"桜井 さくら",text:"…ねえ、私たちってさ、「幼なじみ」だよね。それ以上でも、それ以下でもなくて…"},
  {who:"　",text:"夕日の教室。さくらは窓の外の桜を見つめていた。",choices:[
   {label:"「それ以上になりたいと、思ってる」",effect:()=>{S.aff.sakura=clamp(S.aff.sakura+8)}},
   {label:"「幼なじみは特別だよ」",effect:()=>{S.aff.sakura=clamp(S.aff.sakura+4)}}]},
  {hero:"sakura",who:"桜井 さくら",variant:"shy",text:"…！そ、そうなんだ…。……ありがとう。今日は、よく眠れそう"}]},
 {min:75,title:"第3章 屋上の約束",scenes:[
  {who:"　",text:"卒業が近づいたある日、さくらに呼び止められた。"},
  {hero:"sakura",who:"桜井 さくら",text:"卒業式の日。私、校舎の屋上にいるから。…伝説なんて、本当は関係ないの"},
  {hero:"sakura",who:"桜井 さくら",variant:"shy",text:"私の気持ちを、ちゃんと伝えたい場所が、そこなの。…待ってるから。絶対、来てね"},
  {who:"　",text:"桜色の約束が結ばれた。卒業式の日――屋上で、すべてが決まる。"}]},
 {min:85,title:"第4章 桜の約束",scenes:[
  {who:"　",text:"卒業式まで、あと少し。さくらが、桜の木の下で待っていた。"},
  {hero:"sakura",who:"桜井 さくら",variant:"smile",text:"覚えてる？小さい頃、ここで「また一緒に帰ろう」って約束したこと。…あれが、私の原点なんだ"},
  {hero:"sakura",who:"桜井 さくら",variant:"shy",text:"卒業式の日、屋上で。…今度は私が、{call}を待つ番。…桜が散る前に、必ず来てね"}]}, {min:88,title:"第5章 遠出・御殿山の桜",scenes:[
  {who:"　",text:"休日。さくらに誘われ、バスに揺られて佐久山の御殿山公園まで来た。黒羽の外に出るのは、久しぶりだ。"},
  {hero:"sakura",who:"桜井 さくら",variant:"smile",text:"見て！桜がまだ残ってる！小さい頃、遠足で来たの覚えてる？{call}、お弁当の卵焼き、落としたんだよ"},
  {who:"　",text:"展望台からは、大田原の町が一望できた。いつも見ている黒羽とは、少し違う景色。"},
  {hero:"sakura",who:"桜井 さくら",text:"ねえ、私たちって、ずっと黒羽の中で生きてきたんだね。…たまには、こういう遠出もいいな"},
  {who:"　",text:"さくらが、桜の木の下で振り返った。",choices:[
   {label:"「来年も再来年も、一緒に来よう」",effect:()=>{S.aff.sakura=clamp(S.aff.sakura+6)}},
   {label:"「今日の景色、覚えておこう」",effect:()=>{S.aff.sakura=clamp(S.aff.sakura+3)}}]},
  {hero:"sakura",who:"桜井 さくら",variant:"shy",text:"…約束だよ。卒業しても、その先も。…ふふ、なんだか遠足の続きみたい"}]},
 {min:91,title:"第6章 遠出・金燈籠の願い",scenes:[
  {who:"　",text:"大田原の市街地。大田原神社の前にある金燈籠は、日本でも有数の大きさだという。"},
  {hero:"sakura",who:"桜井 さくら",variant:"smile",text:"おっきい…！ねえ、願い事していい？…内緒だけど、叶ったら教えるね"},
  {who:"　",text:"さくらは燈籠の前で、長く手を合わせていた。"},
  {hero:"sakura",who:"桜井 さくら",variant:"shy",text:"…{call}の願い事は？…言わなくていいよ。だいたい分かるから。…私も、同じだから"},
  {who:"　",text:"帰りのバスを待つ間、さくらが小さく言った。",choices:[
   {label:"「同じ願い、きっと叶うよ」",effect:()=>{S.aff.sakura=clamp(S.aff.sakura+6)}},
   {label:"「バス、来たよ」",effect:()=>{S.aff.sakura=clamp(S.aff.sakura+3)}}]},
  {hero:"sakura",who:"桜井 さくら",variant:"smile",text:"うん…！…あ、バス来た。…今日はありがとう。連れてきてくれて"}]},
 {min:94,title:"第7章 遠出・蛇尾川の土手",scenes:[
  {who:"　",text:"放課後、自転車で蛇尾川の土手を走った。川沿いの道は、夕日に染まっていた。"},
  {hero:"sakura",who:"桜井 さくら",text:"この川、黒羽の那珂川とはまた違うね。…穏やかで、好きだな"},
  {who:"　",text:"土手に座って、二人でジュースを飲んだ。言葉は少なくても、悪くない時間。"},
  {hero:"sakura",who:"桜井 さくら",variant:"shy",text:"…ねえ{call}。卒業したら、離れ離れになるのかな。…なんて、今は考えたくないけど"},
  {who:"　",text:"さくらは、夕日の川面を見つめていた。",choices:[
   {label:"「離れても、ここには帰って来られる」",effect:()=>{S.aff.sakura=clamp(S.aff.sakura+6)}},
   {label:"「今は夕日を見よう」",effect:()=>{S.aff.sakura=clamp(S.aff.sakura+3)}}]},
  {hero:"sakura",who:"桜井 さくら",variant:"smile",text:"…そっか。帰る場所があるって、強いことだね。…よし、暗くなる前に帰ろ！"}]},
 {min:97,title:"第8章 遠出・龍城公園の夕日",scenes:[
  {who:"　",text:"大田原城址・龍城公園。城の跡に立つと、町全体が見渡せた。"},
  {hero:"sakura",who:"桜井 さくら",text:"ここに昔、お城があったんだね。…私たちの学校も、百年後には伝説になってるのかな"},
  {who:"　",text:"夕日が、公園の木々を金色に染めていく。"},
  {hero:"sakura",who:"桜井 さくら",variant:"shy",text:"卒業式まで、あと少し。…屋上の約束、覚えてるよね。…私は、あの日を信じてる"},
  {who:"　",text:"夕日の中で、さくらが笑った。",choices:[
   {label:"「必ず屋上に行くよ」",effect:()=>{S.aff.sakura=clamp(S.aff.sakura+6)}},
   {label:"「忘れるわけない」",effect:()=>{S.aff.sakura=clamp(S.aff.sakura+4)}}]},
  {hero:"sakura",who:"桜井 さくら",variant:"smile",text:"…うん！…じゃあ今日は、これでおしまい。…最後の遠出、楽しかったな"}]}],
akari:[
 {min:35,title:"第1章 隠した痛み",scenes:[
  {who:"　",text:"放課後のコート。あかりの動きが、いつもと違う。左足を、かばっている。"},
  {hero:"akari",who:"星野 あかり",variant:"club",text:"…見てた？大したことないって。大会前だし、休んでられないの"},
  {who:"　",text:"笑ってごまかすあかり。でも、ベンチに座る時、小さく顔をしかめた。",choices:[
   {label:"「無理するな。病院に行こう」",effect:()=>{S.aff.akari=clamp(S.aff.akari+7)}},
   {label:"「…自己責任だよ」",effect:()=>{S.aff.akari=clamp(S.aff.akari-2)}}]},
  {hero:"akari",who:"星野 あかり",variant:"club",text:"…心配してくれるの、{call}だけだよ。ありがと。ちゃんと診てもらう"}]},
 {min:55,title:"第2章 朝練の相方",scenes:[
  {who:"　",text:"リハビリ期間の朝練。走れないあかりの代わりに、球拾いと軽いラリーに付き合う日々が始まった。"},
  {hero:"akari",who:"星野 あかり",text:"ねえ、なんでそこまでしてくれるの？…私、弱いとこ見せるの、苦手なんだ"},
  {hero:"akari",who:"星野 あかり",variant:"shy",text:"でも{call}の前だと、平気なんだよね。不思議。…もう少しだけ、隣にいて"}]},
 {min:75,title:"第3章 約束の決勝",scenes:[
  {who:"　",text:"復帰戦の決勝。あかりはコートで躍動し、最後のポイントを決めた。"},
  {hero:"akari",who:"星野 あかり",variant:"smile",text:"やった…やったよ！{call}が見ててくれたからだ。私の力の半分は、{call}の分！"},
  {hero:"akari",who:"星野 あかり",variant:"shy",text:"卒業してもさ…私のコートの隣、空けとくから。ずっと、応援してよね"}]},
 {min:85,title:"第4章 コートの隣",scenes:[
  {who:"　",text:"最後の大会が終わった夕方。あかりが、使い込んだラケットをそっと差し出した。"},
  {hero:"akari",who:"星野 あかり",variant:"shy",text:"これ、私の宝物。…卒業式の日まで、{call}が預かって。…屋上に、持ってきてくれる？"},
  {hero:"akari",who:"星野 あかり",variant:"smile",text:"返しに来る理由があれば、{call}は絶対に来てくれるでしょ。…待ってるから。コートじゃなく、屋上でね"}]}, {min:88,title:"第5章 遠出・蛇尾川ラン",scenes:[
  {who:"　",text:"休日の朝。あかりに誘われ、蛇尾川沿いをランニングすることになった。"},
  {hero:"akari",who:"星野 あかり",variant:"smile",text:"このコース、信号が少なくて走りやすいんだ！ほら、置いてくよ！"},
  {who:"　",text:"川面が朝日に光る。あかりの背中は、いつもより少し遠かった。"},
  {hero:"akari",who:"星野 あかり",text:"…ねえ。私、卒業したら、もっと遠くの大会にも出てみたい。…{call}は、見に来てくれる？"},
  {who:"　",text:"あかりが、立ち止まって振り返った。",choices:[
   {label:"「どこでも応援に行くよ」",effect:()=>{S.aff.akari=clamp(S.aff.akari+6)}},
   {label:"「まず今日のランを完走しよう」",effect:()=>{S.aff.akari=clamp(S.aff.akari+3)}}]},
  {hero:"akari",who:"星野 あかり",variant:"shy",text:"…！…約束だかんね。…ふふ、じゃあ最後まで付き合ってもらうよ！"}]},
 {min:91,title:"第6章 遠出・風土記の丘サイクリング",scenes:[
  {who:"　",text:"湯津上まで自転車で。那須風土記の丘と、侍塚古墳を見に来た。"},
  {hero:"akari",who:"星野 あかり",variant:"smile",text:"古墳って、思ったよりデカい！昔の人も、ここを走ったりしたのかな"},
  {who:"　",text:"古墳の上に立つと、那須野が原が一望できた。"},
  {hero:"akari",who:"星野 あかり",text:"千五百年前の景色と、今の景色。…{call}と同じものを見てるって、不思議だね"},
  {who:"　",text:"風が、古墳の草を揺らしていた。",choices:[
   {label:"「千五百年後にも残る思い出にしよう」",effect:()=>{S.aff.akari=clamp(S.aff.akari+6)}},
   {label:"「写真、撮ろうか」",effect:()=>{S.aff.akari=clamp(S.aff.akari+3)}}]},
  {hero:"akari",who:"星野 あかり",variant:"shy",text:"…お、たまにはいいこと言うじゃん。…よーし、帰りは競争ね！"}]},
 {min:94,title:"第7章 遠出・金燈籠ダッシュ",scenes:[
  {who:"　",text:"早朝。大田原神社の金燈籠まで、あかりと朝ランでやって来た。"},
  {hero:"akari",who:"星野 あかり",variant:"smile",text:"到着！…はあ、気持ちいい。ここの燈籠、朝日で金色に光るんだよ"},
  {who:"　",text:"静かな境内に、二人の息づかいだけが響いた。"},
  {hero:"akari",who:"星野 あかり",variant:"shy",text:"…ねえ、{call}。私が遠くに行っても…この場所は、変わらないでいてほしいな"},
  {who:"　",text:"朝日の中で、あかりが小さく笑った。",choices:[
   {label:"「変わらないよ。帰る場所はここだ」",effect:()=>{S.aff.akari=clamp(S.aff.akari+6)}},
   {label:"「燈籠に願っておこう」",effect:()=>{S.aff.akari=clamp(S.aff.akari+3)}}]},
  {hero:"akari",who:"星野 あかり",variant:"smile",text:"…うん。…じゃあ、帰りも走るよ！置いてっても知らないからね！"}]},
 {min:97,title:"第8章 遠出・龍城公園の自主練",scenes:[
  {who:"　",text:"龍城公園の広場。あかりの自主練に付き合っていた。"},
  {hero:"akari",who:"星野 あかり",text:"見てて。新しいフォーム…！どう、今の！"},
  {who:"　",text:"夕日の広場で、何度も何度も素振りを繰り返すあかり。"},
  {hero:"akari",who:"星野 あかり",variant:"shy",text:"卒業式の日、屋上の約束…覚えてる？…私の宝物、預けてあるんだから。…必ず、来てね"},
  {who:"　",text:"夕日が、あかりの影を長く伸ばしていた。",choices:[
   {label:"「必ず行く。コートじゃなく、屋上に」",effect:()=>{S.aff.akari=clamp(S.aff.akari+6)}},
   {label:"「宝物は大事に持ってるよ」",effect:()=>{S.aff.akari=clamp(S.aff.akari+4)}}]},
  {hero:"akari",who:"星野 あかり",variant:"smile",text:"…ふふ、楽しみにしてる。…さ、最後にもう一本だけ付き合って！"}]}],
yuki:[
 {min:35,title:"第1章 落ちた原稿",scenes:[
  {who:"　",text:"図書室で、ゆきが慌てて原稿用紙を拾い集めていた。一枚が、足元に滑ってきた。"},
  {hero:"yuki",who:"月島 ゆき",variant:"club",text:"あ…！そ、それは…私が書いた、小説で…。誰にも、見せたことなくて…"},
  {who:"　",text:"震える手で原稿を抱えるゆき。その一枚に書かれた文章は、驚くほど美しかった。",choices:[
   {label:"「続きを、読ませてほしい」",effect:()=>{S.aff.yuki=clamp(S.aff.yuki+8)}},
   {label:"「ごめん、見てないよ」",effect:()=>{S.aff.yuki=clamp(S.aff.yuki+3)}}]},
  {hero:"yuki",who:"月島 ゆき",variant:"shy",text:"…本当ですか。じゃあ…あなたが、私の最初の読者です"}]},
 {min:55,title:"第2章 新人賞への応募",scenes:[
  {who:"　",text:"ゆきが、文学新人賞への応募を決意した。締め切り前夜、図書室で最後の推敲に付き合う。"},
  {hero:"yuki",who:"月島 ゆき",text:"怖いです…。落選したら、私の夢は終わる気がして"},
  {hero:"yuki",who:"月島 ゆき",variant:"smile",text:"…でも、あなたが隣にいてくれるから。…出します。私の物語を、世界へ"}]},
 {min:75,title:"第3章 最初の読者へ",scenes:[
  {who:"　",text:"結果発表の日。ゆきの小説は、佳作に入選した。"},
  {hero:"yuki",who:"月島 ゆき",variant:"smile",text:"入選…しました…！信じられない…。全部、あなたのおかげです"},
  {hero:"yuki",who:"月島 ゆき",variant:"shy",text:"次の物語は…私たちの3年間を書きます。結末は、卒業式の日に。二人で決めましょうね"}]},
 {min:85,title:"第4章 最後のページ",scenes:[
  {who:"　",text:"卒業式の前日。ゆきから、新しい原稿を渡された。タイトルは『屋上の神話』。"},
  {hero:"yuki",who:"月島 ゆき",variant:"shy",text:"最後のページだけ、白紙なんです。…結末は、物語の中の二人じゃなく、私たちが決めるものだから"},
  {hero:"yuki",who:"月島 ゆき",variant:"smile",text:"卒業式の日、屋上で待っています。…二人で、最後のページを埋めましょうね"}]}, {min:88,title:"第5章 遠出・侍塚古墳の取材",scenes:[
  {who:"　",text:"湯津上、なす風土記の丘。ゆきの小説の取材に付き合って、侍塚古墳まで来た。"},
  {hero:"yuki",who:"月島 ゆき",variant:"smile",text:"千五百年以上前のお墓…。ここに眠る人は、どんな物語を生きたんでしょうね"},
  {who:"　",text:"ゆきはノートに、古墳の形を丁寧にスケッチしていた。"},
  {hero:"yuki",who:"月島 ゆき",text:"…物語って、こういう場所から生まれるんだと思います。…今日は、来てよかった"},
  {who:"　",text:"ゆきが、スケッチの手を止めてこちらを見た。",choices:[
   {label:"「ゆきの小説に、この古墳が出てくるのが楽しみ」",effect:()=>{S.aff.yuki=clamp(S.aff.yuki+6)}},
   {label:"「スケッチ、上手だね」",effect:()=>{S.aff.yuki=clamp(S.aff.yuki+3)}}]},
  {hero:"yuki",who:"月島 ゆき",variant:"shy",text:"…！…じゃあ、最初に読むのは…やっぱり、あなたです。…約束、ですよ"}]},
 {min:91,title:"第6章 遠出・大田原神社の参道",scenes:[
  {who:"　",text:"大田原神社の参道。木々に囲まれた石畳は、静かで、少しひんやりしていた。"},
  {hero:"yuki",who:"月島 ゆき",text:"ここ、好きです。…言葉が、自然と静かになる場所です"},
  {who:"　",text:"金燈籠の前で、ゆきは立ち止まって見上げた。"},
  {hero:"yuki",who:"月島 ゆき",variant:"shy",text:"…お願い事、しました。…内容は、内緒です。…でも、あなたも関係あることです"},
  {who:"　",text:"参道に、木漏れ日が揺れていた。",choices:[
   {label:"「叶うといいね。…僕も同じことを願ったよ」",effect:()=>{S.aff.yuki=clamp(S.aff.yuki+6)}},
   {label:"「燈籠、大きいね」",effect:()=>{S.aff.yuki=clamp(S.aff.yuki+3)}}]},
  {hero:"yuki",who:"月島 ゆき",variant:"smile",text:"…！…そ、そうですか。…じゃあ、きっと叶いますね。…二人分ですから"}]},
 {min:94,title:"第7章 遠出・御殿山の読書",scenes:[
  {who:"　",text:"佐久山の御殿山公園。桜の木の下のベンチで、ゆきと並んで本を読んだ。"},
  {hero:"yuki",who:"月島 ゆき",text:"外で読む本は、家で読むのと少し違います。…風の音も、物語の一部みたいで"},
  {who:"　",text:"花びらが、開いたページの上に落ちた。ゆきはそれを、栞の代わりに挟んだ。"},
  {hero:"yuki",who:"月島 ゆき",variant:"shy",text:"…この栞、使います。…あなたと来た日の、証拠みたいなものですから"},
  {who:"　",text:"ページをめくる音だけが、静かに響いた。",choices:[
   {label:"「今度は僕の好きな本も持ってくるよ」",effect:()=>{S.aff.yuki=clamp(S.aff.yuki+6)}},
   {label:"「似合ってるよ、その栞」",effect:()=>{S.aff.yuki=clamp(S.aff.yuki+3)}}]},
  {hero:"yuki",who:"月島 ゆき",variant:"smile",text:"…はい。…次の遠出も、静かな場所がいいです。…あなたとなら、どこでも、ですけど"}]},
 {min:97,title:"第8章 遠出・金燈籠の句",scenes:[
  {who:"　",text:"夕方の大田原神社。金燈籠が、西日に金色に光っていた。"},
  {hero:"yuki",who:"月島 ゆき",text:"芭蕉なら、この燈籠で何と詠むんでしょう…。…私も一句、考えてみました"},
  {who:"　",text:"ゆきは小さな声で、自作の句を読み上げた。燈籠と、二人の影が伸びる句だった。"},
  {hero:"yuki",who:"月島 ゆき",variant:"shy",text:"…卒業式の日、屋上で待っています。…最後のページは、まだ白紙のままです。…二人で埋める、その日まで"},
  {who:"　",text:"西日が、二人の影を長く伸ばしていた。",choices:[
   {label:"「必ず行く。二人で最後のページを埋めよう」",effect:()=>{S.aff.yuki=clamp(S.aff.yuki+6)}},
   {label:"「今日の句、忘れないよ」",effect:()=>{S.aff.yuki=clamp(S.aff.yuki+4)}}]},
  {hero:"yuki",who:"月島 ゆき",variant:"smile",text:"…はい。…今日の遠出が、私の物語の大事な一章になりました"}]}],
rin:[
 {min:35,title:"第1章 生徒会室の居眠り",scenes:[
  {who:"　",text:"放課後の生徒会室。りんが、資料の山にもたれて眠っていた。"},
  {hero:"rin",who:"藤原 りん",variant:"club",text:"…！み、見た？…お願い、今のは忘れて。生徒会長が居眠りなんて…"},
  {who:"　",text:"完璧な生徒会長の、初めて見た無防備な顔。山積みの仕事を、二人で片付けることにした。",choices:[
   {label:"「頼っていいんだよ」",effect:()=>{S.aff.rin=clamp(S.aff.rin+7)}},
   {label:"「意外と可愛い寝顔だった」",effect:()=>{S.aff.rin=clamp(S.aff.rin+5)}}]},
  {hero:"rin",who:"藤原 りん",variant:"shy",text:"…あなたには、弱い所を見せてもいい気がするの。不思議ね"}]},
 {min:55,title:"第2章 猫カフェの秘密",scenes:[
  {who:"　",text:"休日、駅前の猫カフェで、猫にデレデレのりんと目が合った。"},
  {hero:"rin",who:"藤原 りん",text:"…！こ、これは極秘事項よ。生徒会長が猫に弱いなんて、絶対に秘密にして"},
  {hero:"rin",who:"藤原 りん",variant:"smile",text:"…ふふ、でも。あなたになら、見られてもいいかも。次は…一緒に来る？"}]},
 {min:75,title:"第3章 屋上の鍵",scenes:[
  {who:"　",text:"卒業を前に、りんが小さな鍵を見せてくれた。校舎屋上の鍵だ。"},
  {hero:"rin",who:"藤原 りん",text:"卒業式の日、屋上は私が開けるわ。伝説のため…だけじゃないの"},
  {hero:"rin",who:"藤原 りん",variant:"shy",text:"私自身が、屋上で待ちたい人がいるから。…卒業式の日、夕日が沈む前に。来てくれる？"},
  {who:"　",text:"屋上の鍵は、伝説への扉だった。卒業式の日――すべてが決まる。"}]},
 {min:85,title:"第4章 二つ目の鍵",scenes:[
  {who:"　",text:"卒業式の前日。りんが、小さな包みを手渡してきた。中には、屋上の鍵と同じ形の、小さな鍵。"},
  {hero:"rin",who:"藤原 りん",variant:"shy",text:"これは、私の心の鍵。…開けられるのは、世界で一人だけよ"},
  {hero:"rin",who:"藤原 りん",variant:"smile",text:"卒業式の日、夕日が沈む前に、屋上で。…二つの鍵が揃うのを、待っているわ"}]}, {min:88,title:"第5章 遠出・龍城公園の城主",scenes:[
  {who:"　",text:"大田原城址・龍城公園。りんに誘われ、城の歴史を聞きながら歩いた。"},
  {hero:"rin",who:"藤原 りん",variant:"smile",text:"大田原氏のお城よ。…城主の目線で町を見ると、守るべきものの大きさが分かるわ"},
  {who:"　",text:"本丸跡から見渡す町並み。りんはしばらく、静かに眺めていた。"},
  {hero:"rin",who:"藤原 りん",text:"…私も、生徒会長として学園を守ってきたつもり。…卒業したら、誰が守るのかしらね"},
  {who:"　",text:"風が、城址の木々を揺らした。",choices:[
   {label:"「りんの背中を見て育った後輩が、きっと守るよ」",effect:()=>{S.aff.rin=clamp(S.aff.rin+6)}},
   {label:"「たまには守られる側になってもいいんじゃない？」",effect:()=>{S.aff.rin=clamp(S.aff.rin+4)}}]},
  {hero:"rin",who:"藤原 りん",variant:"shy",text:"…ふふ、あなたは時々、核心を突くわね。…今日は、悪くない遠出だったわ"}]},
 {min:91,title:"第6章 遠出・金燈籠と大田原神社",scenes:[
  {who:"　",text:"大田原神社と金燈籠。格式ある場所で、りんの背筋がいつもより伸びていた。"},
  {hero:"rin",who:"藤原 りん",text:"この燈籠、江戸時代からのものよ。…長く残るものには、理由があるの"},
  {who:"　",text:"参道を歩きながら、りんは珍しく、家のことを少しだけ話した。"},
  {hero:"rin",who:"藤原 りん",variant:"shy",text:"…藤原の名を背負うのは、誇りでもあり、重さでもあるの。…あなたにだけ、言うけれど"},
  {who:"　",text:"参道の静けさが、二人を包んでいた。",choices:[
   {label:"「重さは、半分持つよ」",effect:()=>{S.aff.rin=clamp(S.aff.rin+6)}},
   {label:"「話してくれてありがとう」",effect:()=>{S.aff.rin=clamp(S.aff.rin+4)}}]},
  {hero:"rin",who:"藤原 りん",variant:"smile",text:"…ありがとう。…じゃあ、帰りましょう。…今日のことは、二人だけの話よ"}]},
 {min:94,title:"第7章 遠出・風土記の丘の下見",scenes:[
  {who:"　",text:"なす風土記の丘。卒業記念の校外学習の下見に、りんと二人で来た。"},
  {hero:"rin",who:"藤原 りん",variant:"smile",text:"下見は完璧にね。…侍塚古墳、思ったより立派だわ。これなら皆も満足するはず"},
  {who:"　",text:"古墳の上で、りんは行程表を閉じて、景色に目を細めた。"},
  {hero:"rin",who:"藤原 りん",variant:"shy",text:"…下見は二人きり、というのも、悪くないわね。…仕事を忘れるくらいには"},
  {who:"　",text:"古墳の草が、風に波打っていた。",choices:[
   {label:"「卒業までの遠出、あと何回行けるかな」",effect:()=>{S.aff.rin=clamp(S.aff.rin+6)}},
   {label:"「下見、完璧だったね」",effect:()=>{S.aff.rin=clamp(S.aff.rin+3)}}]},
  {hero:"rin",who:"藤原 りん",variant:"smile",text:"…数えるのは、終わってからにしましょう。…まだ、少し残っているわ"}]},
 {min:97,title:"第8章 遠出・御殿山のお茶会",scenes:[
  {who:"　",text:"佐久山・御殿山公園。桜の木の下で、りんが小さなお茶会を開いてくれた。"},
  {hero:"rin",who:"藤原 りん",variant:"smile",text:"特別よ。私のお茶を飲める機会なんて、そうそうないんだから"},
  {who:"　",text:"紙コップのお茶でも、りんが淹れると不思議と格式が漂った。"},
  {hero:"rin",who:"藤原 りん",variant:"shy",text:"…卒業式の日、夕日が沈む前に屋上で。…二つの鍵の約束、忘れていないわよね"},
  {who:"　",text:"桜の花びらが、湯呑みに一つ落ちた。",choices:[
   {label:"「忘れるわけがない。当日、必ず行く」",effect:()=>{S.aff.rin=clamp(S.aff.rin+6)}},
   {label:"「鍵は大事に持っているよ」",effect:()=>{S.aff.rin=clamp(S.aff.rin+4)}}]},
  {hero:"rin",who:"藤原 りん",variant:"smile",text:"…ふふ、よろしい。…じゃあ、最後の遠出はこれでお開き。…名残惜しい、わね"}]}]
};
const CONTACT_REPLIES={
sakura:{chat:"今日ね、帰りに子猫がついてきちゃって…！{call}も見たかったでしょ？今度一緒に探しに行こ？",praise:"えへへ…そんなに褒められると照れるよ。…でも、ありがと。今日はいい夢見れそう",worry:"{call}の相談なら、いつでも聞くよ。…私でよければ、だけどね",plan:"次の休み？…うん、空いてるよ！どこ行くか、考えるの楽しみにしてるね"},
akari:{chat:"今日の練習、マジでキツかった！でもね、新しいフォーム掴めた気がするんだ。今度見に来てよ！",praise:"おっ、分かってるじゃん！{call}に言われると、余計やる気出るわ！",worry:"悩み？…うん、聞くよ。{call}の事なら、放っとけないし",plan:"次の休み、体動かせる所行こうよ！{call}の体力、鍛えてあげる！"},
yuki:{chat:"今、読んでる本がすごく面白くて…。…あ、つい話しすぎました。でも、聞いてくれて嬉しいです",praise:"そ、そんな…。…でも、あなたに言われると、少しだけ自信が持てます",worry:"…私でよければ、聞きます。言葉にするの、少し時間はかかりますけど",plan:"次の休み…。静かな所がいいな、なんて。…あなたとなら、どこでも"},
rin:{chat:"生徒会の仕事がやっと片付いた所よ。…ふふ、あなたの連絡、少し待ってたかも",praise:"…ふん、当然よ。…でも、悪くない気分だわ。ありがとう",worry:"悩みがあるなら聞くわ。…一人で抱えるのは、感心しないから",plan:"次の予定ね。…いいわ、考えておく。期待してなさい"}
};
const CONTACT_TOPICS=[
 {id:"chat",name:"💬 他愛ない話をする",player:"他愛ない話で盛り上がった。"},
 {id:"praise",name:"✨ 褒める",player:"思い切って、彼女のいい所を褒めてみた。"},
 {id:"worry",name:"🫧 悩みを相談する",player:"自分の悩みを、正直に話してみた。"},
 {id:"plan",name:"📅 次の予定を相談する",player:"次の休みの予定について、相談してみた。"}
];
const EVENT_TITLES={2:"夕日の下校路",3:"二人三脚の練習",4:"屋上の伝説",5:"伝説の桜の下で",6:"体育祭",7:"弁論大会",8:"球技大会",9:"梅雨の図書室",10:"水泳大会",11:"期末前の勉強会",12:"七夕",13:"夏休みの計画",14:"期末テスト",15:"海の一日",16:"あかりの誕生日",17:"夏休みの夜の電話",18:"夏祭り",19:"プラネタリウム",20:"水族館の夜",21:"線香花火の夜",22:"看病",23:"さくらの誕生日",24:"文化祭準備",25:"文化祭の買い出し",26:"文化祭",27:"文化祭の片付け",28:"ハロウィン",29:"修学旅行の準備",30:"修学旅行",31:"秋の音楽室コンサート",32:"紅葉の放課後",33:"ゆきの誕生日",34:"スキー合宿",35:"雪の日の図書室",36:"クリスマス",37:"初詣",38:"マラソン大会",39:"冬のイルミネーション",40:"合格お守り",41:"節分",42:"りんの誕生日",43:"チョコ作りの試食係",44:"バレンタイン",45:"卒業アルバムの寄せ書き",46:"ホワイトデー",47:"卒業前日・屋上の誘い"};

/* ================= v2 追加ストーリー（story.js 追記分） ================= */
/* --- 地域イベント追加：黒羽花市（OP画像 op17 の受け皿） --- */
LOCAL_EVENTS.push({id:"hanachi",title:"黒羽花市",img:"sakura",months:[4],fx:{aff:5,stress:-6},text:"春の黒羽花市に、{hero}と出かけた。\n色とりどりの花の苗が並ぶ通りは、町の春の風物詩。\n「この苗、卒業の頃には咲くかな」\n小さな鉢を一つ買って、二人で持ち帰った。"});
/* --- 地域イベントの画像表示とアルバム解放フック --- */
const LOCAL_PICS={yana:"assets/op06.webp",ozeki_kinenhi:"assets/op11.webp",basho_sekihi:"assets/op12.webp",gohou:"assets/op14.webp",ungan_kouyou:"assets/op08.webp",daioji:"assets/op20.webp",yoichi:"assets/op18.webp",shotengai:"assets/op16.webp",kurashi:"assets/op22.webp",basho_yakata:"assets/basho-yakata.webp",yoichi_matsuri:"assets/ev01.webp",ayutsuri:"assets/ev02.webp",ajisai:"assets/ev04.webp",mizuyuen:"assets/ev05.webp",togarashi_harvest:"assets/ev06.webp",kurohacha:"assets/ev07.webp",sangyo_fes:"assets/ev08.webp",kofun:"assets/ev09.webp",ayu_tsukami:"assets/ev10.webp",gelato:"assets/ev12.webp",hanachi:"assets/op17.webp"};
const LOCAL_MEM_MAP={yana:["mem_op06"],ozeki_kinenhi:["mem_op11"],basho_sekihi:["mem_op12"],gohou:["mem_op14"],ungan_kouyou:["mem_op08"],daioji:["mem_op20"],yoichi:["mem_op18"],shotengai:["mem_op16"],kurashi:["mem_op22"],basho_yakata:["mem_op21","mem_bashoyakata"],yoichi_matsuri:["mem_ev01"],ayutsuri:["mem_ev02"],ajisai:["mem_ev04"],mizuyuen:["mem_ev05"],togarashi_harvest:["mem_ev06"],kurohacha:["mem_ev07"],sangyo_fes:["mem_ev08"],kofun:["mem_ev09"],ayu_tsukami:["mem_ev10"],gelato:["mem_ev12"],hanachi:["mem_op17"]};
function localMemHook(ev){if(!ev)return;if(LOCAL_PICS[ev.id])ev.pic=LOCAL_PICS[ev.id];const ms=LOCAL_MEM_MAP[ev.id];if(ms)ms.forEach(id=>unlockMem(id))}
/* ================= ⑫ シークレットルート：保健室の先生（藤原りんの姉） =================
   stage 0 未出会 →（運動コマンドで怪我・50%）→ 1 手当て済
   stage 1 →（休養コマンドで保健室×2回）→ 2
   stage 2 →（地域イベントで姉妹目撃×2）→ 3
   stage 3 →（街で単独遭遇×3）→ 4
   stage 4 かつ 先生の好感度30以上 → 卒業で正体判明＋告白エンド */
function nurseState(){if(!S)return null;if(!S.nurse||typeof S.nurse!=="object")S.nurse={stage:0,visits:0,aff:0,saw:0,solo:0,soloImgs:[]};return S.nurse}
function nurseTryInjury(done){
 const n=nurseState();if(!n||n.stage!==0)return false;
 if(S.turn<2||Math.random()>=0.5)return false;
 n.stage=1;n.aff+=5;unlockMem("mem_nurse01");
 addLog("部活で怪我をして、保健室の先生に手当てしてもらった");
 playNovel([
  {who:"　",text:"運動の時間、足をひねってしまった。保健室へ運ばれることになった。"},
  {who:"　",img:"assets/nurse01.webp",text:"――保健室。白衣の女性が、静かに振り返った。"},
  {who:"保健室の先生",img:"assets/nurse01.webp",motion:"shake",text:"あら、怪我？…無理するからよ。ほら、座って。手当てするわ"},
  {who:"　",text:"黒髪を一つに束ねた、落ち着いた雰囲気の先生。名札には「藤原」とあった。…どこか、りんに似ている気がした。"},
  {who:"保健室の先生",text:"…また何かあったら、いつでも来なさい。ここは、そういう場所だから"},
  {sys:true,text:"🏥 シークレットルート「保健室の先生」が始まった！「休養する」で保健室を訪ねてみよう。"}
 ],()=>{show("screen-game");render();done()},"🏥 保健室の先生");
 return true;
}
function nurseTryOffice(done){
 const n=nurseState();if(!n||n.stage!==1)return false;
 n.visits++;n.aff+=8;
 S.stats.tairyoku=clamp(S.stats.tairyoku+8);S.stats.stress=clamp(S.stats.stress-6);
 const second=n.visits>=2;
 unlockMem(second?"mem_nurse05":"mem_nurse02");
 if(second)n.stage=2;
 addLog("保健室で先生と話した（"+n.visits+"回目）");
 const scenes=second?[
  {who:"　",text:"夕方、なんとなく足が保健室に向いた。"},
  {who:"保健室の先生",img:"assets/nurse05.webp",text:"…また来たのね。ふふ、常連さんだわ"},
  {who:"　",text:"夕日の保健室で、他愛ない話をした。先生の笑顔は、学校ではあまり見せない顔だった。"},
  {sys:true,text:"🏥 先生との距離が縮まった。…そういえばこの前、街でりんと一緒にいる「金髪の女性」を見た気がする――？"}
 ]:[
  {who:"　",text:"休養がてら、保健室の様子を見に来た。"},
  {who:"保健室の先生",img:"assets/nurse02.webp",text:"あら、この前の怪我の子。…もう大丈夫？無理は禁物よ"},
  {who:"　",text:"先生はカルテをまとめながら、時々こちらを気にかけてくれた。静かで、落ち着く時間だった。"},
  {who:"保健室の先生",text:"…また何かあったら、いつでも来なさい。ここは、そういう場所だから"}
 ];
 playNovel(scenes,()=>{show("screen-game");render();done()},"🏥 保健室");
 return true;
}
function nurseSister(done,lead){
 const n=nurseState();n.saw++;n.aff+=3;unlockMem("mem_nurse03");
 if(n.saw>=2)n.stage=3;
 addLog("商店街で、りんと金髪の女性を見かけた（"+n.saw+"回目）");
 const scenes=[];
 if(lead)scenes.push({sys:true,text:lead});
 scenes.push(
  {hero:"rin",who:"　",text:"放課後、商店街でりんと出会った。――隣には、金髪の女性。"},
  {who:"　",img:"assets/nurse03.webp",text:"りんと腕を組んで歩く、金髪の女性。…あの顔、どこかで――保健室の先生に、似ている？"},
  {hero:"rin",who:"藤原 りん",text:"あら、{call}。…買い物よ。紹介は、また今度ね"},
  {who:"　",text:"金髪の女性は、意味ありげに微笑んで、りんと人混みに消えた。"}
 );
 playNovel(scenes,()=>{show("screen-game");render();done()},"🏮 黒羽の出来事");
 return true;
}
const NURSE_SOLO_TEXT={
 "assets/nurse04.webp":["町のカフェ。窓際の席に、金髪の彼女がいた。","あら、奇遇ね。…学校の外では、「先生」って呼ばないで"],
 "assets/nurse06.webp":["那珂川の河原。金髪の彼女が、川を眺めていた。","黒羽の川は、落ち着くわ。…あなたも、そう思う？"],
 "assets/nurse07.webp":["夏まつりの夜。浴衣姿の金髪の彼女と、ばったり出会った。","花火、きれいね。…来年も、見られるかしら"],
 "assets/nurse08.webp":["雪の町。彼女が、温かい缶飲料を差し出した。","寒い日は、これが一番。…ほら、両手で持って"]
};
function nurseSolo(done,lead){
 const n=nurseState();
 const month=dateLabel(S.turn).month;
 let pick=null;
 if((month===7||month===8)&&!n.soloImgs.includes("assets/nurse07.webp"))pick="assets/nurse07.webp";
 else if((month===12||month===1||month===2)&&!n.soloImgs.includes("assets/nurse08.webp"))pick="assets/nurse08.webp";
 else pick=["assets/nurse04.webp","assets/nurse06.webp","assets/nurse07.webp","assets/nurse08.webp"].find(u=>!n.soloImgs.includes(u))||null;
 if(!pick)return false;
 n.soloImgs.push(pick);n.solo++;n.aff+=10;
 unlockMem("mem_nurse"+pick.slice(12,14));
 if(n.solo>=3)n.stage=4;
 addLog("街で金髪の彼女と出会った（"+n.solo+"回目）");
 const tx=NURSE_SOLO_TEXT[pick];
 const scenes=[];
 if(lead)scenes.push({sys:true,text:lead});
 scenes.push(
  {who:"　",text:tx[0]},
  {who:"金髪の女性",img:pick,motion:"jump",text:tx[1]},
  {who:"　",text:"学校の先生とは別人みたいな彼女。…卒業までに、この秘密の答えを知りたい。"}
 );
 playNovel(scenes,()=>{show("screen-game");render();done()},"✨ 街での出会い");
 return true;
}
function nurseTownIntercept(done,lead){
 const n=nurseState();if(!n)return false;
 if(n.stage===2)return nurseSister(done,lead);
 if(n.stage>=3){
   if(n.soloImgs.length>=4)return false;
   if(Math.random()<0.55)return nurseSolo(done,lead);
 }
 return false;
}
function __nurseReady(){const n=S&&S.nurse;return !!(n&&n.stage>=4&&n.aff>=30)}
function __nurseEnding(){
 unlockMem("mem_nurse09");
 playNovel([
  {who:"　",text:"卒業式が終わった。保健室の前を通りかかると、扉が開いた。"},
  {who:"　",img:"assets/nurse09.webp",text:"――立っていたのは、金髪の彼女。街で何度も出会った、あの人だった。"},
  {who:"保健室の先生",img:"assets/nurse09.webp",text:"驚いた？黒髪は学校用のカツラ。…私は藤原りんの姉。保健室の先生は、仮の姿だったの"},
  {who:"保健室の先生",text:"卒業おめでとう。…もう、生徒と先生じゃないわね"},
  {who:"　",text:"屋上への階段。伝説の場所で、彼女が待っていた。"},
  {who:"保健室の先生",img:"assets/nurse10.webp",motion:"jump",text:"3年間、ずっと見てきたわ。…これからは、隣で見させて？"}
 ],()=>{showEndingScreen({type:"nurse"})},"🌇 卒業式・屋上の告白");
}
/* ================= バッドエンド分岐（思い出解放＋エンディング画像差し替え） ================= */
function __v2Ending(e){
 if(!S||!e)return;
 if(!S.flags)S.flags={};
 const top=HEROINES.filter(h=>S.met[h.id]).sort((a,b)=>S.aff[b.id]-S.aff[a.id])[0];
 const U=(id,img)=>{unlockMem(id);if(img&&!S.flags.badImg)S.flags.badImg=img};
 HEROINES.forEach(h=>{const n=h.id;
   if(top&&top.id===n&&(e.type==="almost"||e.type==="rival"))U("mem_bad_"+n+"01","assets/bad-"+n+"01.webp");
   if(((S.hurt&&S.hurt[n])||0)>=50)U("mem_bad_"+n+"02");
   if(!S.met[n])U("mem_bad_"+n+"03");
   if((S.aff[n]||0)>=40&&(e.type==="friend"||e.type==="life"))U("mem_bad_"+n+"04",(e.type==="friend"&&e.h&&e.h.id===n)?("assets/bad-"+n+"04.webp"):"");
 });
 if(e.type==="life"){U("mem_bad_player01","assets/bad-player01.webp");if(e.life==="none")U("mem_bad_player02","assets/bad-player02.webp")}
 if(e.type==="almost")U("mem_bad_player03","assets/bad-player03.webp");
 if(e.type==="rival")U("mem_bad_player04","assets/bad-player04.webp");
}
