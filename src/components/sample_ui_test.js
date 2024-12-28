import { get_user_data } from '@/utils/data_fetch';
import Navbar from "@/components/Navbar";
import Result_UI from "./result_ui_v2";

export default async function Home() {

  const user_data = await get_user_data();

  const results = {
    "frameCheck": {
      "model_name": "altfreeze_multifaces",
      "threshold": 0.7,
      "labels_result": {
        "0": [
          {
            "prediction": 0.3098154664039612,
            "bbox": [
              282,
              46,
              364,
              171
            ],
            "start_index": 0,
            "end_index": 16
          },
          {
            "prediction": 0.38840800523757935,
            "bbox": [
              283,
              46,
              365,
              172
            ],
            "start_index": 16,
            "end_index": 32
          },
          {
            "prediction": 0.370114803314209,
            "bbox": [
              281,
              46,
              364,
              171
            ],
            "start_index": 32,
            "end_index": 48
          },
          {
            "prediction": 0.16080987453460693,
            "bbox": [
              277,
              43,
              360,
              171
            ],
            "start_index": 48,
            "end_index": 64
          },
          {
            "prediction": 0.8949710428714752,
            "bbox": [
              274,
              46,
              357,
              174
            ],
            "start_index": 64,
            "end_index": 80
          },
          {
            "prediction": 0.006184577941894531,
            "bbox": [
              275,
              47,
              359,
              174
            ],
            "start_index": 80,
            "end_index": 96
          },
          {
            "prediction": 0.03282743692398071,
            "bbox": [
              277,
              51,
              361,
              177
            ],
            "start_index": 96,
            "end_index": 112
          },
          {
            "prediction": 0.052195072174072266,
            "bbox": [
              277,
              51,
              360,
              177
            ],
            "start_index": 112,
            "end_index": 128
          },
          {
            "prediction": 0.23630577325820923,
            "bbox": [
              280,
              51,
              362,
              178
            ],
            "start_index": 128,
            "end_index": 144
          },
          {
            "prediction": 0.3464169502258301,
            "bbox": [
              281,
              52,
              362,
              178
            ],
            "start_index": 144,
            "end_index": 160
          },
          {
            "prediction": 0.39699774980545044,
            "bbox": [
              280,
              50,
              362,
              177
            ],
            "start_index": 160,
            "end_index": 176
          },
          {
            "prediction": 0.045601844787597656,
            "bbox": [
              279,
              48,
              362,
              174
            ],
            "start_index": 176,
            "end_index": 192
          },
          {
            "prediction": 0.3757491707801819,
            "bbox": [
              280,
              56,
              362,
              180
            ],
            "start_index": 192,
            "end_index": 208
          },
          {
            "prediction": 0.02636253833770752,
            "bbox": [
              280,
              53,
              362,
              181
            ],
            "start_index": 208,
            "end_index": 224
          }
        ],
        "1": [
          {
            "prediction": 0.0390738844871521,
            "bbox": [
              365,
              45,
              400,
              94
            ],
            "start_index": 228,
            "end_index": 244
          },
          {
            "prediction": 0.030846834182739258,
            "bbox": [
              367,
              46,
              403,
              96
            ],
            "start_index": 244,
            "end_index": 260
          },
          {
            "prediction": 0.01976490020751953,
            "bbox": [
              369,
              46,
              404,
              95
            ],
            "start_index": 260,
            "end_index": 276
          },
          {
            "prediction": 0.0016932487487792969,
            "bbox": [
              370,
              46,
              406,
              95
            ],
            "start_index": 276,
            "end_index": 292
          },
          {
            "prediction": 0.021840155124664307,
            "bbox": [
              372,
              46,
              408,
              95
            ],
            "start_index": 292,
            "end_index": 308
          },
          {
            "prediction": 0.20615500211715698,
            "bbox": [
              373,
              46,
              409,
              94
            ],
            "start_index": 308,
            "end_index": 324
          },
          {
            "prediction": 0.7284348607063293,
            "bbox": [
              349,
              49,
              384,
              96
            ],
            "start_index": 324,
            "end_index": 340
          },
          {
            "prediction": 0.8932498395442963,
            "bbox": [
              544,
              37,
              611,
              126
            ],
            "start_index": 340,
            "end_index": 356
          },
          {
            "prediction": 0.9731791354715824,
            "bbox": [
              544,
              39,
              609,
              126
            ],
            "start_index": 356,
            "end_index": 372
          },
          {
            "prediction": 0.9689570926129818,
            "bbox": [
              549,
              43,
              614,
              128
            ],
            "start_index": 372,
            "end_index": 388
          },
          {
            "prediction": 0.9149095490574837,
            "bbox": [
              556,
              52,
              623,
              138
            ],
            "start_index": 388,
            "end_index": 404
          },
          {
            "prediction": 0.9548740275204182,
            "bbox": [
              605,
              44,
              660,
              126
            ],
            "start_index": 425,
            "end_index": 441
          }
        ],
        "2": [
          {
            "prediction": 0.9668909423053265,
            "bbox": [
              141,
              62,
              175,
              108
            ],
            "start_index": 228,
            "end_index": 244
          },
          {
            "prediction": 0.1915271282196045,
            "bbox": [
              130,
              64,
              161,
              111
            ],
            "start_index": 244,
            "end_index": 260
          },
          {
            "prediction": 0.7346743047237396,
            "bbox": [
              131,
              62,
              162,
              111
            ],
            "start_index": 260,
            "end_index": 276
          },
          {
            "prediction": 0.869530439376831,
            "bbox": [
              136,
              64,
              168,
              110
            ],
            "start_index": 276,
            "end_index": 292
          },
          {
            "prediction": 0.8487309813499451,
            "bbox": [
              159,
              66,
              192,
              104
            ],
            "start_index": 292,
            "end_index": 308
          },
          {
            "prediction": 0.8240728825330734,
            "bbox": [
              186,
              65,
              220,
              107
            ],
            "start_index": 308,
            "end_index": 324
          },
          {
            "prediction": 0.9994005895568989,
            "bbox": [
              215,
              67,
              248,
              114
            ],
            "start_index": 324,
            "end_index": 340
          },
          {
            "prediction": 0.9999252965935739,
            "bbox": [
              209,
              58,
              275,
              150
            ],
            "start_index": 340,
            "end_index": 356
          },
          {
            "prediction": 0.998944100108929,
            "bbox": [
              216,
              57,
              281,
              151
            ],
            "start_index": 356,
            "end_index": 372
          },
          {
            "prediction": 0.9999147743583308,
            "bbox": [
              235,
              62,
              296,
              153
            ],
            "start_index": 372,
            "end_index": 388
          },
          {
            "prediction": 0.9997514935676008,
            "bbox": [
              236,
              68,
              297,
              164
            ],
            "start_index": 388,
            "end_index": 404
          },
          {
            "prediction": 0.9979925439693034,
            "bbox": [
              237,
              64,
              301,
              160
            ],
            "start_index": 404,
            "end_index": 420
          },
          {
            "prediction": 0.8887014389038086,
            "bbox": [
              278,
              64,
              323,
              156
            ],
            "start_index": 420,
            "end_index": 436
          },
          {
            "prediction": 0.42862164974212646,
            "bbox": [
              286,
              45,
              365,
              153
            ],
            "start_index": 504,
            "end_index": 520
          },
          {
            "prediction": 0.29187142848968506,
            "bbox": [
              290,
              44,
              368,
              153
            ],
            "start_index": 520,
            "end_index": 536
          },
          {
            "prediction": 0.4662879705429077,
            "bbox": [
              291,
              45,
              369,
              155
            ],
            "start_index": 536,
            "end_index": 552
          },
          {
            "prediction": 0.02327406406402588,
            "bbox": [
              289,
              45,
              368,
              154
            ],
            "start_index": 552,
            "end_index": 568
          },
          {
            "prediction": 0.040978074073791504,
            "bbox": [
              289,
              45,
              367,
              153
            ],
            "start_index": 568,
            "end_index": 584
          },
          {
            "prediction": 0.4064823389053345,
            "bbox": [
              289,
              45,
              367,
              154
            ],
            "start_index": 584,
            "end_index": 600
          },
          {
            "prediction": 0.03986150026321411,
            "bbox": [
              290,
              43,
              368,
              156
            ],
            "start_index": 600,
            "end_index": 616
          },
          {
            "prediction": 0.15336674451828003,
            "bbox": [
              290,
              43,
              368,
              154
            ],
            "start_index": 616,
            "end_index": 632
          },
          {
            "prediction": 0.00013720989227294922,
            "bbox": [
              289,
              43,
              368,
              153
            ],
            "start_index": 632,
            "end_index": 648
          },
          {
            "prediction": 0.03446775674819946,
            "bbox": [
              289,
              43,
              368,
              155
            ],
            "start_index": 648,
            "end_index": 664
          },
          {
            "prediction": 0.11751812696456909,
            "bbox": [
              290,
              44,
              368,
              154
            ],
            "start_index": 664,
            "end_index": 680
          },
          {
            "prediction": 0.04234200716018677,
            "bbox": [
              289,
              44,
              368,
              157
            ],
            "start_index": 680,
            "end_index": 696
          },
          {
            "prediction": 0.535862386226654,
            "bbox": [
              290,
              43,
              368,
              154
            ],
            "start_index": 696,
            "end_index": 712
          },
          {
            "prediction": 0.11259043216705322,
            "bbox": [
              290,
              38,
              369,
              150
            ],
            "start_index": 712,
            "end_index": 728
          },
          {
            "prediction": 0.016741275787353516,
            "bbox": [
              290,
              32,
              370,
              145
            ],
            "start_index": 728,
            "end_index": 744
          }
        ]
      },
      "duration": 90,
      "result": 0.2601971647569111
    },
    "audioAnalysis": {
      "model_name": "SSL w1",
      "threshold": 0.7,
      "table_data": [
        {
          "prediction": 0.0003424856695346534,
          "index": 3
        },
        {
          "prediction": 0.00025851416285149753,
          "index": 6
        },
        {
          "prediction": 0.00025963285588659346,
          "index": 9
        },
        {
          "prediction": 0.00025025472859852016,
          "index": 12
        },
        {
          "prediction": 0.00023701638565398753,
          "index": 15
        },
        {
          "prediction": 0.00027272035367786884,
          "index": 18
        },
        {
          "prediction": 0.00024233055592048913,
          "index": 21
        },
        {
          "prediction": 0.9996386766433716,
          "index": 24
        },
      ],
      "duration": 90,
      "result": 0.125,
    },

  }

  const file_metadata = {
    "name": "Anant Ambani dobaara.mp4",
    "size": "3.31 MB",
    "type": "video/mp4",
    "verifier_comment": "Sample case for testing the slackbot" 
  }

  return (
    <>
      <Navbar user_data={user_data} />
      <div className=' pt-16 pb-10 px-12'>
        <Result_UI 
          results={results}
          analysisTypes={{frameCheck: true, audioAnalysis: true, aigcCheck: true,}}
          file_metadata={file_metadata}
          fileUrl={'./video.mp4'}
        />
      </div>
    </>
  )
}

/*
    -> get labels with images
    -> get model responses for clips. sections for which we have responses

    labels => label_id-> img

    data=> label-> [(start_frame, end_frame, value), ...]

    every 16 frames stack
    
*/