import React, { useState, useEffect, useRef } from 'react';
import {
  Alert,
  Button,
  Card,
  Form,
  ProgressBar,
  Modal
} from 'react-bootstrap';
import {
  Volume2,
  Mic,
  MicOff,
  AlertCircle,
  Send,
  CheckCircle
} from 'lucide-react';

export default function VoiceForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [currentField, setCurrentField] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech Recognition is not supported in this browser. Please use Google Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setCurrentTranscript("");
    };

    recognition.onerror = (e) => {
      console.error("Speech recognition error:", e);
      setError("Microphone error or permission denied.");
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      moveToNextField();
    };

    recognition.onresult = (event) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        finalTranscript += event.results[i][0].transcript;
      }
      setCurrentTranscript(finalTranscript);

      const processedText = finalTranscript.toLowerCase().trim();

      if (processedText.includes("reset form") || processedText.includes("clear form")) {
        resetForm();
        return;
      }

      if (processedText.includes("submit form") || processedText.includes("send form")) {
        handleSubmit();
        return;
      }

      switch (currentField) {
        case "name":
          const nameValue = processedText.replace(/(my )?name is/, "").trim();
          if (nameValue) setName(nameValue);
          break;
        case "email":
          const emailValue = processedText
          .replace(/(my )?email is/gi, "")
          .replace(/\s+at\s+| at /gi, "@")
          .replace(/\s+dot\s+| dot /gi, ".")
          .replace(/\s+underscore\s+| underscore /gi, "_")
          .replace(/\s+dash\s+| dash /gi, "-")
          .replace(/\s/g, "") 
          .trim();
          if (emailValue) setEmail(emailValue);
          break;
        case "message":
          const messageValue = processedText.replace(/(my )?message is/, "").trim();
          if (messageValue) setMessage(messageValue);
          break;
        default:
          break;
      }
    };

    recognitionRef.current = recognition;
  }, [currentField]);

  const startRecording = (field) => {
    stopRecording();
    setCurrentField(field);
    setCurrentTranscript("");
    setTimeout(() => {
      try {
        recognitionRef.current?.start();
      } catch (err) {
        console.error("Start error:", err);
        setError("Unable to start voice recognition. Try again.");
      }
    }, 300);
  };

  const stopRecording = () => {
    try {
      recognitionRef.current?.stop();
    } catch (err) {
      console.error("Stop error:", err);
    }
  };

  const moveToNextField = () => {
    if (currentField === "name" && name) {
      setTimeout(() => setCurrentField("email"), 500);
    } else if (currentField === "email" && email) {
      setTimeout(() => setCurrentField("message"), 500);
    } else if (currentField === "message" && message) {
      setCurrentField(null);
    }
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setMessage("");
    setCurrentField(null);
    setProgress(0);
    setCurrentTranscript("");
    stopRecording();
  };

  const handleSubmit = async () => {
    if (!name || !email || !message) {
      setError("Please fill all fields before submitting.");
      return;
    }

    try {
      setIsListening(false);
      setError(null);
      await new Promise((res) => setTimeout(res, 1500));
      setShowSuccess(true);
      setTimeout(() => {
        resetForm();
        setShowSuccess(false);
      }, 5000);
    } catch (err) {
      console.error(err);
      setError("Submission failed. Try again.");
    }
  };

  useEffect(() => {
    const completed = [name, email, message].filter(Boolean).length;
    setProgress((completed / 3) * 100);
  }, [name, email, message]);

  return (
    <div className='row'>
      <div className="col-md-5 m-auto">
        <Card className="shadow">
          <Card.Header className="bg-primary text-white" style={{ background: 'linear-gradient(to right, #9333ea, #4f46e5)' }}>
            <h6 className="mb-0"><Volume2 className="me-2" size={24} />Voice-Controlled Form</h6>
          </Card.Header>
          <Card.Body>
            <p className="text-muted mb-4">Speak to fill out this form - no typing required</p>
            <ProgressBar
              variant={progress === 100 ? "success" : "primary"}
              now={progress}
              className="mb-4"
              label={progress === 100 ? "Ready to submit!" : `${Math.round(progress)}% complete`}
            />
            {error && (
              <Alert variant="danger">
                <AlertCircle className="me-2" size={20} /><strong>Error:</strong> {error}
              </Alert>
            )}
            <Form>
              {["name", "email", "message"].map((field) => (
                <Form.Group className="mb-3" key={field}>
                  <Form.Label className="text-capitalize">{field}</Form.Label>
                  <div className="input-group">
                    <Form.Control
                      as={field === "message" ? "textarea" : "input"}
                      rows={field === "message" ? 3 : undefined}
                      type={field === "email" ? "email" : "text"}
                      value={field === "name" ? name : field === "email" ? email : message}
                      onChange={(e) => {
                        const val = e.target.value;
                        field === "name" ? setName(val)
                          : field === "email" ? setEmail(val)
                          : setMessage(val);
                      }}
                      placeholder={`Enter your ${field}`}
                    />
                    <Button
                      variant={currentField === field ? "danger" : "btn-primary"}
                      onClick={() =>
                        currentField === field ? stopRecording() : startRecording(field)
                      }
                    >
                      {currentField === field ? (
                        <>
                          <MicOff size={18} className="me-1" /> Stop
                        </>
                      ) : (
                        <>
                          <Mic size={18} className="me-1 " /> Record
                        </>
                      )}
                    </Button>
                  </div>
                  {currentField === field && (
                    <Alert variant="info" className="py-1 px-2 mt-1">
                      <small><Volume2 size={14} className="me-1" /> Listening for {field}...</small>
                    </Alert>
                  )}
                </Form.Group>
              ))}
            </Form>
            {isListening && (
              <Alert variant="primary" className="mt-3">
                <Mic size={18} className="me-2" />
                <strong>Listening...</strong>
                <p className="mb-0 mt-1">{currentTranscript || "Say something..."}</p>
              </Alert>
            )}
          </Card.Body>
          <Card.Footer className="d-flex justify-content-between">
            <Button variant="outline-secondary" onClick={resetForm}>
              Reset
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={progress < 100}
              style={{ background: 'linear-gradient(to right, #9333ea, #4f46e5)' }}
            >
              {isListening ? "Wait..." : "Submit Form"}
              {!isListening && <Send size={18} className="ms-2" />}
            </Button>
          </Card.Footer>
        </Card>
        <Modal show={showSuccess} centered>
          <Modal.Header className="bg-success text-white">
            <Modal.Title><CheckCircle size={24} className="me-2" />Success!</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Your form has been successfully submitted.</p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="success" onClick={() => setShowSuccess(false)}>Close</Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
}
