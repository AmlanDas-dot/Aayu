from IndicTransToolkit import IndicProcessor
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch

MODEL_NAME = "ai4bharat/indictrans2-indic-en-1B"

device = "cuda" if torch.cuda.is_available() else "cpu"

print("Loading processor...")
ip = IndicProcessor(inference=True)

print("Loading tokenizer...")
tokenizer = AutoTokenizer.from_pretrained(
    MODEL_NAME,
    trust_remote_code=True
)

print("Loading model...")
model = AutoModelForSeq2SeqLM.from_pretrained(
    MODEL_NAME,
    trust_remote_code=True
).to(device)

tests = [
    # Gujarati
    ("guj_Gujr", "મને તાવ આવ્યો છે અને શરીર દુખે છે."),
    ("guj_Gujr", "મને સતત ઉલ્ટી થઈ રહી છે."),
    ("guj_Gujr", "મને ઝાડા થઈ રહ્યા છે અને શરીરમાં નબળાઈ લાગે છે."),
    ("guj_Gujr", "મને છાતીમાં દુખાવો થાય છે."),
    ("guj_Gujr", "મને શ્વાસ લેવામાં તકલીફ થઈ રહી છે."),
    ("guj_Gujr", "મને ચક્કર આવી રહ્યા છે અને ઊભા રહેવામાં મુશ્કેલી થાય છે."),
    ("guj_Gujr", "હું ગર્ભવતી છું અને પેટમાં દુખાવો થાય છે."),
    ("guj_Gujr", "મને દવાથી એલર્જી થઈ ગઈ છે અને શરીર પર ચકામા થયા છે."),
    ("guj_Gujr", "મને સાપે દંશ માર્યો છે."),
    ("guj_Gujr", "મને કૂતરાએ કાટ્યું છે."),
    ("guj_Gujr", "મેં ભૂલથી વધારે દવા લઈ લીધી છે."),

    # Hindi
    ("hin_Deva", "मुझे बुखार है और पूरे शरीर में दर्द हो रहा है।"),
    ("hin_Deva", "मुझे लगातार उल्टी हो रही है।"),
    ("hin_Deva", "मुझे दस्त हो रहे हैं और कमजोरी महसूस हो रही है।"),
    ("hin_Deva", "मेरी छाती में दर्द हो रहा है।"),
    ("hin_Deva", "मुझे साँस लेने में कठिनाई हो रही है।"),
    ("hin_Deva", "मुझे चक्कर आ रहे हैं और खड़े रहने में परेशानी हो रही है।"),
    ("hin_Deva", "मैं गर्भवती हूँ और पेट में दर्द हो रहा है।"),
    ("hin_Deva", "मुझे दवा से एलर्जी हो गई है और शरीर पर चकत्ते हो गए हैं।"),
    ("hin_Deva", "मुझे साँप ने काट लिया है।"),
    ("hin_Deva", "मुझे कुत्ते ने काट लिया है।"),
    ("hin_Deva", "मैंने गलती से दवा की ज़्यादा मात्रा ले ली है।"),

    # Odia
    ("ory_Orya", "ମୋତେ ଜ୍ୱର ହୋଇଛି ଏବଂ ସମଗ୍ର ଶରୀର ବ୍ୟଥା କରୁଛି।"),
    ("ory_Orya", "ମୋତେ ଲଗାତାର ବାନ୍ତି ହେଉଛି।"),
    ("ory_Orya", "ମୋତେ ଝାଡ଼ା ହେଉଛି ଏବଂ ଦୁର୍ବଳ ଲାଗୁଛି।"),
    ("ory_Orya", "ମୋର ଛାତିରେ ବ୍ୟଥା ହେଉଛି।"),
    ("ory_Orya", "ମୋତେ ଶ୍ୱାସ ନେବାରେ ଅସୁବିଧା ହେଉଛି।"),
    ("ory_Orya", "ମୋତେ ମୁଣ୍ଡ ଘୁରୁଛି ଏବଂ ଠିଆ ହେବାରେ ଅସୁବିଧା ହେଉଛି।"),
    ("ory_Orya", "ମୁଁ ଗର୍ଭବତୀ ଅଛି ଏବଂ ପେଟରେ ବ୍ୟଥା ହେଉଛି।"),
    ("ory_Orya", "ମୋତେ ଔଷଧରୁ ଆଲର୍ଜି ହୋଇଛି ଏବଂ ଶରୀରରେ ଦାଗ ହୋଇଛି।"),
    ("ory_Orya", "ମୋତେ ସାପ କାମୁଡ଼ିଛି।"),
    ("ory_Orya", "ମୋତେ କୁକୁର କାମୁଡ଼ିଛି।"),
    ("ory_Orya", "ମୁଁ ଭୁଲରେ ଅଧିକ ଔଷଧ ଖାଇଦେଇଛି।"),
]

for src_lang, sentence in tests:

    batch = ip.preprocess_batch(
        [sentence],
        src_lang=src_lang,
        tgt_lang="eng_Latn"
    )

    inputs = tokenizer(
        batch,
        padding=True,
        truncation=True,
        return_tensors="pt"
    ).to(device)

    generated = model.generate(
        **inputs,
        max_new_tokens=256
    )

    translations = tokenizer.batch_decode(
        generated,
        skip_special_tokens=True
    )

    translations = ip.postprocess_batch(
        translations,
        lang="eng_Latn"
    )

    print("\n" + "=" * 60)
    print(f"LANGUAGE : {src_lang}")
    print(f"INPUT    : {sentence}")
    print(f"OUTPUT   : {translations[0]}")